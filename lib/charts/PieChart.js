//
// Pie Chart:
//=======================================
define([ 
  'chart/BaseChart', 
  'd3' 
], function (BaseChart, d3) {
  
  var PieChartView = BaseChart.View.extend({
    initialize: function () {
      var model, o = {};
      model  = this.model;

      o.w  = model.get('width');
      o.h = model.get('height');
      o.r = Math.min(o.w, o.h) / 2;
      o.color  = model.get('color');
      o.strokeColour = model.get('strokeColour');
      o.strokeWidth = model.get('strokeWidth');
      o.group = model.get('group');

      this.options = o;
      this.chart = d3.select(this.model.get('id'))
        .append("svg")
          .attr('width', o.w)
          .attr('height', o.h)
        .append('g')
          .attr("transform", "translate(" + o.r + "," + o.r + ")");

    },

    render: function () {
      var data, chart, o;
          
      o = this.options;
      
      // recalculate the group
      data = o.group.orderNatural().top(Infinity);

      chart = d3.select("body")
        .append("svg:svg")              //create the SVG element inside the <body>
        .data([data])                   //associate our data with the document
          .attr("width", o.w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
          .attr("height", o.h)
        .append("svg:g")                //make a group to hold our pie chart
          .attr("transform", "translate(" + o.r + "," + o.r + ")");    //move the center of the pie chart from 0, 0 to radius, radius
   
      this.pie(chart, data);       //get the label from our original data array
          
      return BaseChart.View.prototype.render.call(this, chart);
    },

    pie: function (chart, data) {
    	var pie, arc, arcs, o = this.options;

    	pie = d3.layout.pie()           //this will create arc data for us given a list of values
        .value(function(d) { return d.value; });

    	arc = d3.svg.arc()              //this will create <path> elements for us using arc data
        .outerRadius(o.r);

    	arcs = chart.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
        .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
        .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
          .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
            .attr("class", "slice");    //allow us to style things in the slices (like text)
 
        arcs.append("svg:path")
          .attr("fill", function(d, i) { 
            return o.color(i); 
          }) 
          .attr('stroke', o.strokeColour)
          .attr('stroke-width', o.strokeWidth)
          .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function
 
        arcs.append("svg:text")                                     //add a label to each slice
          .attr("transform", function(d) {                    //set the label's origin to the center of the arc
            //we have to make sure to set these before calling arc.centroid
            d.innerRadius = 0;
            d.outerRadius = o.r;
            return "translate(" + arc.centroid(d) + ")";        //this gives us a pair of coordinates like [50, 50]
          })
        .attr("text-anchor", "middle")                          //center the text on it's origin
        .text(function(d, i) { return data[i].label; }); 
    }

  });

  var PieChart = BaseChart.Model.extend({
    view: PieChartView,
    defaults: _.extend({}, BaseChart.Model.prototype.defaults(), { 
      title: 'Data',
      colour: d3.scale.category20c(),
      strokeColour: '#fff',
      strokeWidth: '2'
    })
  });

  return {
    Model: PieChart,
    View: PieChartView
  };
});