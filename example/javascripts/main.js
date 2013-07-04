requirejs.config({
	baseUrl: '../lib/vendor',
	paths: {
		app: '../',
		data: '../../module-example/npower',
		chart: '../charts'
	},

	shim: {
		'backbone': {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		},
		'underscore': {
			exports: '_'
		},
		'crossfilter': {
			exports: 'crossfilter'
		},
		'd3': {
			exports: 'd3'
		}
	}
});

requirejs([
	'app/crossbone',
	'text!data/consumerData.json'
], function(CrossBone, consumerData) {

	var consumptionData = JSON.parse(consumerData).energyData.consumptionData;
  var crossbone = new CrossBone(consumptionData);

  crossbone.dataChart('#data-count', {
    dimension: crossbone.all(),
    group: crossbone.groupAll()
  });

  var loftInsulation = crossbone.dimension('loftInsulation');
  var currentSupplier = crossbone.dimension('currentSupplier');

  crossbone.pieChart('#pieChart', {
    dimension: loftInsulation,
    group: loftInsulation.group()
  });

  crossbone.barChart('#barChart', {
    dimension: currentSupplier,
    group: currentSupplier.group()
  });

  crossbone.renderAll();


	function parseDate(d) {
	  return new Date(2001, 
	    d.substring(0, 2) -1,
	    d.substring(2, 4),
	    d.substring(4, 6),
	    d.substring(6, 8));
	}

});