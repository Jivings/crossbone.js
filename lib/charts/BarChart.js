define([ 
	'd3',
	'chart/BaseChart'
], function (d3, BaseChart) {

	var BarChartView = BaseChart.View.extend({

    initialize: function () {
    	this.root = d3.select(this.model.get('id'))
    		.append("svg");
    
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

      
      chart = this.root.append('g')
        .attr("transform", "translate(" + 15 + "," + 20 + ")")
      


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
      
      
      



      // d3.select(this.model.get('id')).append("svg")
      //   .attr("class", "chart")
      //   .attr("width", 420 + padding.x)
      //   .attr("height", y.rangeBand() * barData.length + padding.y)
      //   );
      

      return this;
      //return BaseChartView.prototype.render.call(this, this.chart);
    }
  });

  var BarChart = BaseChart.Model.extend({
    view: BarChartView,
    defaults: _.extend({}, BaseChart.Model.prototype.defaults(), { 
      title: 'Bar Chart',
      barWidth: '20',
      barGap: '2',
      padding: {
        x: 50,
        y: 45 
      }
    })
  });

  return {
  	Model: BarChart,
  	View: BarChartView
  }
});