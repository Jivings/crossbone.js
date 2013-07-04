var CrossBone = (function (Backbone, CrossFilter) {

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
      this.crossfilter = new CrossFilter(this.attributes.data);
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
      this.add(new DataChart(id, o));
    },

    pieChart: function (id, o) {
      this.add(new PieChart(id, o));
    },

    geoChart: function (id, o) {
      this.add(new GeoChart(id, o));
    },

    barChart: function (id, o) {
      this.add(new BarChart(id, o));
    }
  });

  //
  // SuperModel for CrossBone charts
  //=====================================
  var BaseChart = Backbone.Model.extend({
    defaults: function () {
      return {
        title: 'Base Chart',
        height: 200,
        width: 200,
        padding: 10,
        color: function (i) {
          return d3.scale.category20().range()[i];
        },
        valueAccessor: function (d) {
          return d.value;
        },
        keyAccessor: function (d) {
          return d.key;
        }
      };
    },

    constructor: function () {
      arguments[1].id = arguments[0];
      Backbone.Model.apply(this, Array.prototype.slice.call(arguments, 1));
    },

    render: function () {
      this.$el.find('.title').text(this.model.get('title'))
        .height(this.model.get('height'))
        .width(this.model.get('width'));
    }
  });

  //
  // SuperView for CrossBone Charts
  //========================================
  var BaseChartView = Backbone.View.extend({
    initialize: function () {
      this.listenTo(this.model, 'change', this.render);
      this.$el = $(this.model.get('id'));
    },
    render: function(chart) {
      // convert chart to jQuery so we can cache 
      // it with Backbone
      this.$el = $(chart[0]);
      // finally add it to the page
      return this;
    }
  });

  //
  // Data Chart:
  // A view of the total data count 
  // and filtered count of the crossfilter
  //========================================
  var DataChartView = BaseChartView.extend({
    
    render: function () {
      var $filtered = this.model.get('filteredRecords');
      var $total = this.model.get('totalRecords');

      this.$el.find($filtered)
        .text(this.model.get('filtered'));

      this.$el.find($total)
        .text(this.model.get('total'));
      return this;
    }

  });

  //
  //
  //=======================================
  var DataChart = BaseChart.extend({
    view: DataChartView,
    defaults: _.extend({}, BaseChart.prototype.defaults(), { 
      title : 'Data',
      filteredRecords: '.filtered',
      totalRecords: '.total',
      filtered: 0,
      total: 0
    }),

    initialize: function () {
      this.set('format', this.get('format') || d3.format(",d"))
        .set('total', this.attributes.dimension.size())
        .set('filtered', this.attributes.group.value());
    }
  });

  //
  // Pie Chart:
  //=======================================
  var PieChartView = BaseChartView.extend({
    render: function () {
      var w, h, r, color, strokeColour, strokeWidth,
          arc, pie, svg, data, g, key, 
          model, el, chart, arcs;

      model  = this.model;
      w  = model.get('width');
      h = model.get('height');
      r = Math.min(w, h) / 2;
      color  = model.get('color');
      strokeColour = model.get('strokeColour');
      strokeWidth = model.get('strokeWidth');
      
      data = model.get('group').orderNatural().top(Infinity);

      chart = d3.select("body")
        .append("svg:svg")              //create the SVG element inside the <body>
        .data([data])                   //associate our data with the document
          .attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
          .attr("height", h)
        .append("svg:g")                //make a group to hold our pie chart
          .attr("transform", "translate(" + r + "," + r + ")");    //move the center of the pie chart from 0, 0 to radius, radius
   
      arc = d3.svg.arc()              //this will create <path> elements for us using arc data
        .outerRadius(r);
   
      pie = d3.layout.pie()           //this will create arc data for us given a list of values
        .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array
   
      arcs = chart.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
        .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
        .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
          .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
            .attr("class", "slice");    //allow us to style things in the slices (like text)
 
        arcs.append("svg:path")
          .attr("fill", function(d, i) { 
            return color(i); 
          }) 
          .attr('stroke', strokeColour)
          .attr('stroke-width', strokeWidth)
          .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function
 
        arcs.append("svg:text")                                     //add a label to each slice
          .attr("transform", function(d) {                    //set the label's origin to the center of the arc
            //we have to make sure to set these before calling arc.centroid
            d.innerRadius = 0;
            d.outerRadius = r;
            return "translate(" + arc.centroid(d) + ")";        //this gives us a pair of coordinates like [50, 50]
          })
        .attr("text-anchor", "middle")                          //center the text on it's origin
        .text(function(d, i) { return data[i].label; });        //get the label from our original data array
          
      return BaseChartView.prototype.render.call(this, chart);
    }
  });

  var PieChart = BaseChart.extend({
    view: PieChartView,
    defaults: _.extend({}, BaseChart.prototype.defaults(), { 
      title: 'Data',
      colour: d3.scale.category20c(),
      strokeColour: '#fff',
      strokeWidth: '2'
    })
  });


  var BarChartView = BaseChartView.extend({

    initialize: function () {
    
      this.createBars();
    
    },

    createBars: function () {
      
    },

    applyLabels: function () {
     
        
    },

    createGrid: function () {
     
    },

    xAxis: function () {
      return d3.scale.linear()
        .domain([0, d3.max(this.barData)])
        .range([0, 420]);
    },

    yAxis: function () {
      return d3.scale.ordinal()
        .domain(this.barData)
        .rangeBands([0, 120]);
    },

    render: function() {
      var chart, model = this.model,
          padding, width, height;

      var data = this.model.get('group').orderNatural().top(Infinity);
      var barData = this.barData = _.map(data, this.model.get('valueAccessor'));
      var y = this.yAxis();
      var x = this.xAxis();

      padding = this.model.get('padding');
      width   = this.model.get('width');
      height  = this.model.get('height');

      chart = d3.select(this.model.get('id')).append("svg")
        .attr("class", "chart")
        .attr("width", 420 + padding.x)
        .attr("height", y.rangeBand() * barData.length + padding.y)
      .append("g")
        .attr("transform", "translate(" + 15 + "," + 20 + ")");

      chart.selectAll("rect")
        .data(barData)
      .enter().append("rect")
        .attr("y", y)
        .attr("width", x)
        .attr("height", y.rangeBand())
        .attr('fill', 'steelblue')
        .attr('stroke', '#fff')

      chart.selectAll("text")
        .data(barData)
      .enter().append("text")
        .attr("x", x)
        .attr("y", function(d) { return y(d) + y.rangeBand() / 2; })
        .attr("dx", -3) // padding-right
        .attr("dy", ".35em") // vertical-align: middle
        .attr("text-anchor", "end") // text-align: right
        .text(function(d, i) {
          return model.get('keyAccessor')(data[i]);
        })
        .attr('fill', '#fff')
        .attr('font-size', '10');

      chart.selectAll("line")
        .data(x.ticks(10))
      .enter().append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", 0)
        .attr("y2", 120)
        .style("stroke", "#ccc");

     chart.selectAll(".rule")
       .data(x.ticks(10))
     .enter().append("text")
       .attr("class", "rule")
       .attr("x", x)
       .attr("y", 0)
       .attr("dy", -3)
       .attr("text-anchor", "middle")
       .attr('font-size', 10)
       .text(String);

     chart.append("line")
       .attr("y1", 0)
       .attr("y2", 120)
       .style("stroke", "#000");
      this.$el = $(chart[0]);
      //$(this.model.get('id')).append(this.$el);
      return this;
      //return BaseChartView.prototype.render.call(this, this.chart);
    }
  });

  var BarChart = BaseChart.extend({
    view: BarChartView,
    defaults: _.extend({}, BaseChart.prototype.defaults(), { 
      title: 'Bar Chart',
      barWidth: '20',
      barGap: '2',
      padding: {
        x: 50,
        y: 45 
      }
    })
  });

  //
  // Geo Coloropleph
  //==============================
  var GeoChartView = BaseChartView.extend({
    render: function () {
      var width = 960,
          height = 500;

      var projection = d3.geo.mercator()
          .scale(width)
          .translate([width / 2, height / 2]);

      var path = d3.geo.path()
          .projection(projection);

      var zoom = d3.behavior.zoom()
          .translate(projection.translate())
          .scale(projection.scale())
          .scaleExtent([height, 8 * height])
          .on("zoom", zoom);

      var svg = d3.select("body").append("svg")
          .attr("width", width)
          .attr("height", height);

      var states = svg.append("g")
          .attr("id", "states")
          .call(zoom);

      states.append("rect")
          .attr("width", width)
          .attr("height", height);

        states.selectAll("path")
            .data(this.model.get('geoJSON').features)
          .enter().append("path")
            .attr("d", path)
            .on("click", click);
      

      var click = function (d) {
        var centroid = path.centroid(d),
            translate = projection.translate();

        projection.translate([
          translate[0] - centroid[0] + width / 2,
          translate[1] - centroid[1] + height / 2
        ]);

        zoom.translate(projection.translate());

        states.selectAll("path").transition()
            .duration(1000)
            .attr("d", path);
      };

      // var svg, geo, zoom, projection;

      // svg = d3.select("body").append("svg")
      //   .attr("width", this.model.get('width'))
      //   .attr("height", this.model.get('height'));

      // projection = this.model.get('projection');
      // geo = svg.append('g')
      //   .attr("width", this.model.get('width'))
      //   .attr("height", this.model.get('height'));
      
      // geo.append("rect")
      //   .attr("width", this.model.get('width'))
      //   .attr("height", this.model.get('height'))
      //   .style('fill', 'none')
      //   .style('pointer-events', 'all');

      // geo.selectAll("path")
      //     .data(this.model.get('geoJSON').features)
      //   .enter().append("path")
      //     .attr("d", this.path())
      //     .on("click", this.onClick)
      //     .style('fill', '#aaa')
      //     .style('stroke', '#fff')
      //     .style('stroke-width', '1.5px');

      // if (this.model.get('zoomable')) {
      //   zoom = d3.behavior.zoom()
      //     .translate(projection.translate())
      //     .scale(projection.scale())
      //     .scaleExtent([this.model.get('height'), 8 * this.model.get('height')])
      //     .on("zoom", this.zoom);
      //   geo.call(zoom);
      // };
      
      // this.geo = geo; 
      return this;
    },

    path: function () {
      return d3.geo.path().projection(this.model.get('projection'));
    },

    zoom: function () {
      this.model.get('projection').translate(d3.event.translate).scale(d3.event.scale);
      this.geo.selectAll("path").attr("d", this.path);
    }
  });

  var GeoChart = BaseChart.extend({
    view: GeoChartView,
    defaults: _.extend({}, BaseChart.prototype.defaults(), {
      title: 'Map',
      zoomable: false,
      geoJSON: null,
      projection: null
    })
  });

  return CrossBone;
  
})(Backbone, crossfilter);