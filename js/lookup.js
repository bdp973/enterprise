/**
* Lookup Control
*/

/* start-amd-strip-block */
(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function($) {
/* end-amd-strip-block */

  $.fn.lookup = function(options) {
    'use strict';

    // Settings and Options
    var pluginName = 'lookup',
        defaults = {
          click: null
        },
        settings = $.extend({}, defaults, options);

    // Plugin Constructor
    function Lookup(element) {
      this.element = $(element);
      this.init();
    }

    // Plugin Methods
    Lookup.prototype = {

      init: function() {
        this.settings = settings;
        this.build();
        this.handleEvents();
      },

      // Example Method
      build: function() {
         var lookup = this.element;

        //Add Button
        this.icon = $('<span class="trigger" tabindex="-1"><svg class="icon" focusable="false" aria-hidden="true" role="presentation"><use xlink:href="#icon-search-list"/></svg></span>');
        this.container = $('<div class="lookup-wrapper"></div>');
        lookup.wrap(this.container);
        lookup.after(this.icon);

        //Add Masking to show the #
        if (lookup.attr('data-mask')) {
          lookup.mask();
        }

        if (this.element.is(':disabled')) {
          this.disable();
        }

        this.addAria();
      },

      // Add/Update Aria
      addAria: function () {
        this.element.attr('aria-haspopup', true);

        $('label[for="'+ this.element.attr('id') + '"]')
          .append('<span class="audible">' + Locale.translate('UseArrow') + '</span>');
      },

      handleEvents: function () {
        var self = this;

        if (this.settings.click) {
          this.element.on('click.lookup', function () {
            self.openDialog();
          });
        }

        this.element.on('keypress.lookup', function (e) {
          if (e.which === 13 || e.which === 32) {
            self.openDialog();
          }
        });

      },

      closeDialog: function () {
        this.element.trigger('close');
      },

      openDialog: function () {
        this.element.trigger('open');
      },

      enable: function() {
        this.element.prop('disabled', false);
        this.element.parent().removeClass('is-disabled');
      },

      disable: function() {
        this.element.prop('disabled', true);
        this.element.parent().addClass('is-disabled');
      },

      isDisabled: function() {
        return this.element.prop('disabled');
      },

      // Teardown - Remove added markup and events
      destroy: function() {
        $.removeData(this.element[0], pluginName);
        this.element.off('click.dropdown keypress.dropdown');
      }
    };

    // Initialize the plugin (Once)
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (instance) {
        instance.settings = $.extend({}, defaults, options);
      } else {
        instance = $.data(this, pluginName, new Lookup(this, settings));
      }
    });
  };

/* start-amd-strip-block */
}));
/* end-amd-strip-block */
