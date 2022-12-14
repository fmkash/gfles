/*
 author: montage  date: 2012/08/01
 */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory); // AMD support for RequireJS etc.
  } else {
    factory();
  }
}(function () {
  String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d)\}/g, function () {
      return args[arguments[1]];
    });
  };

  var doc = window.document,
    defaults = {
      //message: 'Loading...',
      zIndex: 100,
      css: {
        position: 'fixed'
      },
      overlayCss: {
        backgroundColor: '#000',
        opacity: 0.4,
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%'
      },
      pos: 'fixed',
      overlayClick: false,
      needOverlay: true,
      onOpen: null,
      onClose: null,
      resetForm: false,
      destroy: false
    },

    maskui = function () {};

  maskui.queue = [];		//å­˜æ”¾å¼¹å‡ºå±‚

  maskui.queueClear = function () {
    $.each(maskui.queue, function (i, v) {
      v.hide();
    });
    maskui.queue = [];
  };

  maskui.inQueue = function(){
    $.each(maskui.queue, function (i, v) {
      v.hide();
    });
    maskui.queue = [];
  }

  maskui.prototype = {
    open: function (o) {

      var _ui, el = o.elem;

      if (typeof el === 'string' && !o.content) {
        _ui = $('#' + el);
      } else if (typeof el === 'object' && el.nodeType && el.nodeType == 1) {
        _ui = $(el);
      } else if (typeof el === 'object' && el.selector !== undefined && el.length > 0) {
        _ui = el;
      } else if (o.content !== undefined) {
        var id = o.id;
        if(id && $('#' + id).length){
          _ui = $('#' + id);
        }else{
          _ui = $($.maskUI.config.wrap.format((id || ''), o.content));
        }

        o.destroy = typeof o.destroy === 'undefined' ? true: o.destroy;
      } else {
        return false;
      }

      o.ui = _ui;

      //æ·±åº¦åˆå¹¶ æ³¨æ„è¿™é‡Œçš„extendå¦‚æžœä¸åŠ ç¬¬2ä¸ªå‚æ•°{} å°±ä¼šä¿®æ”¹defaults
      $.extend(true, this, defaults, o);


      if ($.isFunction(this.onOpen)) {
        this.onOpen.call(_ui, this);
      }

      if (this.needOverlay) {
        this.createOverlay();
      }

      this.createContent();
    },

    alert: function (param, btnValue) {
      if(typeof param === 'string'){
        this.open({
          content: $.maskUI.config.alert.format(param, btnValue || 'Okay')
        });
      }else if($.isPlainObject(param)){

        param.content = $.maskUI.config.alert.format(param.msg, btnValue || 'Okay');
        this.open(param);
      }

    },

    confirm: function (o) {
      var _this = this;
      this.createCallback = function () {
        var ui = this;
        ui.on('click', 'a.confirm_ok', function (e) {
          e.preventDefault();
          o.callback.call(ui);
          $.maskUI.close.call(ui, _this);
        });
      };

      o.content = $.maskUI.config.confirm.format(o.msg, o.className);
      o.overlayClick = false;
      this.open(o);
    },

    createOverlay: function () {
      var exCSS = {'z-index': this.zIndex};

      if (maskui.overlay) {
        maskui.overlay.css($.extend({}, this.overlayCss, exCSS)).show();
      } else {
        maskui.overlay = $('<div/>').attr('id', 'maskOverlay').css($.extend({}, this.overlayCss, exCSS)).prependTo($('body'));
      }
      maskui.queueClear();
    },

    createContent: function () {
      var ui = this.ui, _this = this;

      maskui.queueClear();

      if (!$.contains(document.body, ui[0])) {
        ui.appendTo($('body'));
      }

      var _css,
        wh = $(window).height(),
        h = this.ui.outerHeight(),
        isOverflowing = h > wh;

      //dialogçš„é«˜åº¦æ˜¯å¦è¶…å‡ºæµè§ˆå™¨é«˜åº¦
      if(isOverflowing){
        this.pos = 'absolute';
      }

      if(this.pos === 'fixed'){
        _css = {
          'margin-left': -1 * Math.floor(ui.outerWidth() / 2) + 'px',
          'margin-top': -1 * Math.floor(ui.outerHeight() / 2) + 'px',
          'top': '50%',
          'left': '50%',
          'position': 'fixed',
          'z-index': parseInt(this.zIndex, 10) + 1,
          'display': 'block'
        }
      }else if(this.pos === 'absolute'){
        var top;
        if(isOverflowing){
          top = parseInt($(window).scrollTop()) + 10;
        }else{
          top = parseInt($(window).scrollTop()) + (wh - h)/2;
        }
        _css = {
          'margin-left': -1 * Math.floor(ui.outerWidth() / 2) + 'px',
          'top': top,
          'left': '50%',
          'position': 'absolute',
          'z-index': parseInt(this.zIndex, 10) + 1,
          'display': 'block'
        }

      }

      ui.css($.extend({}, this.css, _css));
      maskui.queue.push(ui);

      if (this.overlayClick) {
        $('#maskOverlay').on('click', function () {
          $.maskUI.close.call(ui, _this);
        });
      }

      ui.find('.maskui_close,.maskuiclose, #dialogClose, a.dialog_close').on('click', function (e) {
        e.preventDefault();
        $.maskUI.close.call(ui, _this);
      });

      if (this.createCallback) {
        this.createCallback.call(ui);
      }
    }
  };

  $.maskUI = {
    config: {
      wrap: '<section class="maskui_dialog" id="{0}"><div class="dialog_con"><a href="javascript:;" class="dialog_close"></a>{1}</div></section>',
      alert: '<div class="dialog_ac"><div>{0}</div><p><a href="javascript:;" class="maskui_close dialog_btn">{1}</a></p></div>',
      confirm: '<div class="dialog_ac"><div>{0}</div><p><a href="javascript:;" class="confirm_ok dialog_btn">Okay</a><a href="javascript:;" class="maskui_close dialog_btn">Cancel</a></p></div>'
    },
    open: function (o) {
      var m = new maskui();
      m.open(o);
      return m;
    },
    alert: function (msg, btnValue) {
      var m = new maskui();
      m.alert(msg, btnValue);
      return m;
    },
    confirm: function (o) {
      var m = new maskui();
      m.confirm(o);
      return m;
    },
    close: function (t) {

      //t ä¸ºjqueryå¯¹è±¡æ—¶åšä¸ºå†…éƒ¨å‚æ•°ä½¿ç”¨
      $('#maskOverlay').fadeOut(200).off('click');

      if(t){
        //this == dialog
        if (t.closeCallback) {
          t.closeCallback.call(this);
        }

        //
        if (t.onClose) {
          t.onClose.call(this);
        }

        if(t.resetForm){
          var innerForm = this.find('form').eq(0);
          if(innerForm.length){
            innerForm[0].reset();
          }
        }

        if (t.destroy) {
          this.remove();
        }
      }


      if (this.selector) {
        this.find('.maskui_close,.maskuiclose, #dialogClose, a.dialog_close').off('click');
      }
      maskui.queueClear();
    }
  };
}));
