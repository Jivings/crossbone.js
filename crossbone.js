!function() {

  'use strict'

  var ChartList = Backbone.Collection.extend({
    model: BaseChart,
    // store built charts in localstorage
    localStorage: new Backbone.LocalStorage("crossbone-charts"),
  });

  this.CrossBone = Backbone.Model.extend({

    constructor: function() {
      var attributes = arguments[1] || {};
      if ( arguments.length > 0 ) {
        attributes.data = arguments[0];
      }
      Backbone.Model.apply(this, [ attributes, Array.prototype.slice.call(arguments, 1)]);
    },

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
    },

    render: function() {
      this.$el.find('.title').text(this.model.get('title'))
        .height(this.model.get('height'))
        .width(this.model.get('width'));
    }
  });

  var BaseChartView = Backbone.View.extend({
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.$el = $(this.model.get('id'));
    }
  });

  /*
   * Data Chart
   */
  var DataChartView = BaseChartView.extend({
    
    render: function() {
      var $filtered = this.model.get('filteredRecords');
      var $total = this.model.get('totalRecords');

      this.$el.find($filtered)
        .text(this.model.get('filtered'));

      this.$el.find($total)
        .text(this.model.get('total'));
      return this;
    }
  });

  var DataChart = BaseChart.extend({
    defaults: _.extend({}, BaseChart.prototype.defaults(), { 
      title : 'Data',
      filteredRecords: '.filtered',
      totalRecords: '.total',
      filtered: 0,
      total: 0
    }),

    initialize: function() {
      this.set('format', this.get('format') || d3.format(",d"))
        .set('total', this.attributes.dimension.size())
        .set('filtered', this.attributes.group.value());
    }
  });

  /*
   *  Pie Chart
   */ 
  var PieChartView = BaseChartView.extend({
    render: function() {
      var width = this.model.get('width'),
          height = this.model.get('height'),
          radius = Math.min(width, height) / 2;

      var color = this.model.get('color');
      

      var arc = d3.svg.arc()
          .outerRadius(radius - 10)
          .innerRadius(0);

      var pie = d3.layout.pie()
          .sort(null)
          .value(function(d) { return this.model.group().size(); }) ;

      var svg = d3.select("body").append("svg")
          .attr("width", width)
          .attr("height", height)
        .append("g")
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      var pieData = this.model.group().naturalOrder().top(Infinity)

        var g = svg.selectAll(".arc")
            .data(pie(pieData))
          .enter().append("g")
            .attr("class", "arc");

        g.append("path")
            .attr("d", arc)

        g.append("text")
            .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
            .attr("dy", ".35em")
            .style("text-anchor", "middle")

    }
  });

  var PieChart = BaseChart.extend({
    defaults: _.extend({}, BaseChart.prototype.defaults(), { 
      title : 'Data',
      color : d3.scale.ordinal()
                .range(["#98abc5", "#8a89a6", "#7b6888", 
                  "#6b486b", "#a05d56", "#d0743c", "#ff8c00"])
    }),
  });
  
  
}.call(this)