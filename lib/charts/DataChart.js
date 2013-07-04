//
// Data Chart:
// A view of the total data count 
// and filtered count of the crossfilter
//========================================
  
define([
	'chart/BaseChart',
  'jquery',
 	'd3',	
], function(BaseChart, $) {
	
  var DataChartView = BaseChart.View.extend({
    
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

  var DataChart = BaseChart.Model.extend({
    view: DataChartView,
    defaults: _.extend({}, BaseChart.Model.prototype.defaults(), { 
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

  return {
    Model: DataChart,
    View: DataChartView
  };

});