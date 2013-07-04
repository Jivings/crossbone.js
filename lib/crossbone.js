define([
	'jquery',
	'backbone',
	//'vendor/underscore',
	// load all the charts
	'chart/DataChart',
	'chart/BaseChart',
	'chart/PieChart',
	'chart/BarChart',
	// no exports
	'backbone.localstorage',
	'crossfilter'
], function ( $, Backbone, DataChart, BaseChart, PieChart, BarChart ) {

	'use strict';

  // FIXME
  var filtered = false;

  var ChartList = Backbone.Collection.extend({
    model: BaseChart,
    // store built charts in localstorage
    localStorage: new Backbone.LocalStorage("crossbone-charts")
  });

  var CrossBone = Backbone.Model.extend({

  	constructor: function () {
      var attributes = arguments[1] || {};
      if ( arguments.length > 0 ) {
        attributes.data = arguments[0];
      }
      Backbone.Model.apply(this, [ attributes, Array.prototype.slice.call(arguments, 1)]);
    },

    initialize: function () {
      this.crossfilter = new crossfilter(this.attributes.data);
      this.group = this.crossfilter.groupAll();
      this.charts = new ChartList();
      // be aware of any charts added to the Chart list
      this.listenTo(this.charts, 'add', this.preRender);
      // get any existing charts from localstorage
      // so they don't have to be rebuilt
      this.charts.fetch();
      this.chartViews = [];
    },

    dimension: function () {
      var dimension = arguments[0];
      return typeof dimension === 'string' ? 
        this.crossfilter.dimension(function(d) { return d[dimension]; } ) :
        this.crossfilter.dimension(dimension);
    },

    chart: function (chart) {
      chart.preRender(this.crossfilter, this.all);
      this.charts.add(chart);
    },
    
    add: function (chart) {
      this.charts.add(chart);
      //var chartView = new ChartView({ model : chart });
      //chart.$el.append(view.render().el)
      //this.render(chart);
    },

    preRender: function (chart) {
      // create the chart view
      var chartView = new chart.view({
        model: chart       
      });
      // pre-render the chart so it can be 
      // added to the page without lag
      this.chartViews.push(chartView);
    },

    count: function () {
      return this.crossfilter.size();
    },

    all: function () {
      return this.crossfilter;
    },

    groupAll: function () {
      return this.group;
    },

    renderAll: function () {
      _.each(this.chartViews, function(chartView) {
        $(chartView.model.get('el')).append(chartView.render().$el);
      });
    },

    dataChart: function (id, o) {
      this.add(new DataChart.Model(id, o));
    },

    pieChart: function (id, o) {
      this.add(new PieChart.Model(id, o));
    },

    geoChart: function (id, o) {
      this.add(new GeoChart(id, o));
    },

    barChart: function (id, o) {
      this.add(new BarChart.Model(id, o));
    }
  });

	// CrossBone extensibility;|
	CrossBone.Model = {
    extend: BaseChart.Model.extend
  };
  CrossBone.View = {
  	extend: BaseChart.View.extend
  };

  return CrossBone;

});