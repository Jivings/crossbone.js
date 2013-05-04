!function() {

  'use strict'

  // FIXME
  var filtered = false;

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

    dimension: function() {
      return typeof arguments[0] === 'string' 
        ? this.crossfilter.dimension(function(d) { return arguments[0] } )
        : this.crossfilter.dimension(arguments[0]);
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
      var chartView = new chart.view({
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
    },

    pieChart: function(id, o) {
      this.add(new PieChart(id, o));
    }
  });

  var BaseChart = Backbone.Model.extend({

    defaults: function() {
      return {
        title: 'Base Chart',
        height: 200,
        width: 200,
        color: function(i) {
          return d3.scale.category20().range()[i];
        }
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
    view: DataChartView,
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
      var width, height, radius, color,
          arc, pie, svg, pieData, g, key, 
          model, el, chart;

      model  = this.model;
      width  = model.get('width');
      height = model.get('height');
      radius = Math.min(width, height) / 2;
      color  = model.get('color');
      
      pieData = model.get('group').orderNatural().top(Infinity)
      arc = d3.svg.arc()
          .outerRadius(radius - 10)
          .innerRadius(0);

      pie = d3.layout.pie()
       .sort(null)
       .value(function(d) { 
          return model.get('group').size(); 
        });

      // convert to d3 element for processing.
      el = d3.select(this.$el[0]);
      svg = el.append("svg")
        .attr("width", width)
        .attr("height", height);

      key = svg.append('g')
        .attr('class', 'key');    
      chart = svg.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      g = chart.selectAll(".arc")
          .data(pie(pieData))
        .enter().append("g")
          .attr("class", "arc")

      g.append("path")
        .attr("d", arc)
        .attr('fill', function(d, i) {
          return color(i);
        })
        .on('mouseover', function(d, i) {
          d3.select(this)
            .attr('transform', "matrix(1.1, 1,1, 0, 0, -35, -35)")
            .attr('stroke-width', '1px')
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('transform', "matrix(1,0,0,1,0,0)")
            .attr('stroke-width', '2px')
        })
        .on('click', function(d, i) {
          filtered = !filtered;
          g.selectAll('path')
            .attr('fill', 'grey' )
          d3.select(this)
            .attr('fill', color(i))
        })
        .attr('stroke-width', '2px')
        .attr('transform', 'matrix(1,0,0,1,0,0)')

    
      key.append("text")
        .style("text-anchor", "middle")

      // convert back to jQuery element for Backbone storage
      this.$el = $(svg[0]);

      return this;
    }
  });

  var PieChart = BaseChart.extend({
    view: PieChartView,
    defaults: _.extend({}, BaseChart.prototype.defaults(), { 
      title : 'Data'
    }),
  });
  
  
}.call(this)