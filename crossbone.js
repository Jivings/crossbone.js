!function() {

  'use strict'

  var ChartList = Backbone.Collection.extend({
    model: BaseChart,
    // store built charts in localstorage
    localStorage: new Backbone.LocalStorage("crossbone-charts"),
  });

  

  this.CrossBone = Backbone.Model.extend({

    initialize: function() {
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

    chart: function(chart) {
      chart.preRender(this.crossfilter, this.all);
      this.charts.add(chart);
    },
    
    add: function(chart) {
      this.charts.add(chart);
      //var chartView = new ChartView({ model : chart });
      //chart.$el.append(view.render().el)
      //this.render(chart);
    },

    preRender: function(chart) {
      // create the chart view
      var chartView = new DataChartView({
        model: chart       
      });
      // pre-render the chart so it can be 
      // added to the page without lag
      this.chartViews.push(chartView);
    },

    count: function() {
      return this.crossfilter.size();
    },

    all: function() {
      return this.crossfilter;
    },
    groupAll: function() {
      return this.group;
    },

    renderAll: function() {
      _.each(this.chartViews, function(chartView) {
        $(chartView.model.get('el')).append(chartView.render().$el)
      })
    },

    dataChart: function(id, o) {
      this.add(new DataChart(id, o));
    }

  });

  var BaseChart = Backbone.Model.extend({

    defaults: function() {
      return {
        title: 'Base Chart',
        height: 200,
        width: 200
      }
    },

    constructor: function() {
      arguments[1].id = arguments[0];
      Backbone.Model.apply(this, Array.prototype.slice.call(arguments, 1));
    }
  });

  var BaseChartView = Backbone.View.extend({
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.$el = $(this.model.get('id'));
    }
  });

  var DataChartView = BaseChartView.extend({
    render: function() {
      this.$el.find('.filtered').text(this.model.get('filtered'));
      this.$el.find('.total').text(this.model.get('total'));
      return this;
    }
  });

  var DataChart = BaseChart.extend({
    defaults: _.extend({}, BaseChart.prototype.defaults(), { 
      title : 'Data' 
    }),

    initialize: function() {
      this.set('format', this.get('format') || d3.format(",d"))
        .set('total', this.attributes.dimension.size())
        .set('filtered', this.attributes.group.value());
    }
  });
  
  
}.call(this)