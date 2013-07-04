//
// The Super Model for CrossBone Charts
//
// Defines some basic functionality and default values.

define([ 
  'd3', 
  'jquery', 
  'backbone',
  'underscore'
], function(d3, $, Backbone) {

  'use strict';

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

  return {
    Model: BaseChart,
    View: BaseChartView
  };

});