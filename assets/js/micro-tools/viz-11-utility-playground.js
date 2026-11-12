/* Viz 11 — Utility Function Playground
   Three types: Cobb-Douglas, Perfect Substitutes, Perfect Complements.
   Dynamic parameter sliders; 5 ICs at varying utility levels.        */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var maxX = 20, maxY = 20;
    var state = {
      type: 'cobb-douglas',
      cdAlpha: 0.5,
      subA: 1, subB: 1,
      compA: 1, compB: 1
    };

    /* Type buttons */
    MT.addButton('controls-11', {
      label: 'Cobb-Douglas', className: 'active',
      onClick: function () { switchType('cobb-douglas'); }
    });
    MT.addButton('controls-11', {
      label: 'Perfect Substitutes',
      onClick: function () { switchType('perfect-subs'); }
    });
    MT.addButton('controls-11', {
      label: 'Perfect Complements',
      onClick: function () { switchType('perfect-comp'); }
    });

    /* Dynamic slider container */
    var paramDiv = document.createElement('div');
    paramDiv.id = 'params-11';
    document.getElementById('controls-11').appendChild(paramDiv);

    function switchType(t) {
      state.type = t;
      d3.select('#controls-11').selectAll('.micro-btn')
        .classed('active', function () {
          var text = d3.select(this).text();
          if (t === 'cobb-douglas') return text === 'Cobb-Douglas';
          if (t === 'perfect-subs') return text === 'Perfect Substitutes';
          return text === 'Perfect Complements';
        });
      buildSliders();
      render();
    }

    function buildSliders() {
      d3.select('#params-11').selectAll('*').remove();
      if (state.type === 'cobb-douglas') {
        MT.addSlider('params-11', {
          label: 'How much you value X vs Y (\u03B1)', min: 0.1, max: 0.9, value: state.cdAlpha, step: 0.05,
          format: function (v) {
            if (v < 0.4) return v.toFixed(2) + ' (prefer Y)';
            if (v > 0.6) return v.toFixed(2) + ' (prefer X)';
            return v.toFixed(2) + ' (balanced)';
          },
          onChange: function (v) { state.cdAlpha = v; update(); }
        });
      } else if (state.type === 'perfect-subs') {
        MT.addSlider('params-11', {
          label: 'Value per unit of X (a)', min: 0.5, max: 3, value: state.subA, step: 0.25,
          format: function (v) { return v.toFixed(2); },
          onChange: function (v) { state.subA = v; update(); }
        });
        MT.addSlider('params-11', {
          label: 'Value per unit of Y (b)', min: 0.5, max: 3, value: state.subB, step: 0.25,
          format: function (v) { return v.toFixed(2); },
          onChange: function (v) { state.subB = v; update(); }
        });
      } else {
        MT.addSlider('params-11', {
          label: 'Units of X per bundle (a)', min: 0.5, max: 3, value: state.compA, step: 0.25,
          format: function (v) { return v.toFixed(2); },
          onChange: function (v) { state.compA = v; update(); }
        });
        MT.addSlider('params-11', {
          label: 'Units of Y per bundle (b)', min: 0.5, max: 3, value: state.compB, step: 0.25,
          format: function (v) { return v.toFixed(2); },
          onChange: function (v) { state.compB = v; update(); }
        });
      }
    }

    buildSliders();

    var chart, xScale, yScale, dynamicG;

    function setup() {
      chart = MT.createChart('chart-11', { height: 420 });
      xScale = d3.scaleLinear().domain([0, maxX]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, maxY]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();
      MT.drawAxes(chart, xScale, yScale, 'Good X', 'Good Y', { xTicks: 10, yTicks: 10 });
      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynamicG) { render(); return; }
      dynamicG.selectAll('*').remove();
      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var levels = [2, 5, 8, 12, 16];
      var opacities = [0.4, 0.6, 0.8, 0.9, 1.0];
      var label, interp;

      for (var i = 0; i < levels.length; i++) {
        drawIC(dynamicG, levels[i], colors.demand, 2, opacities[i]);
      }

      if (state.type === 'cobb-douglas') {
        label = 'U(x,y) = x^{' + MT.fmt(state.cdAlpha, 2) + '} y^{' + MT.fmt(1 - state.cdAlpha, 2) + '}';
        interp = '<strong>Cobb-Douglas:</strong> Smooth, convex curves. You always want <em>some</em> of both goods.' +
          '<br>\u03B1 = ' + MT.fmt(state.cdAlpha, 2) + ' means you spend ' + MT.fmt(state.cdAlpha * 100, 0) +
          '% of your budget on X and ' + MT.fmt((1 - state.cdAlpha) * 100, 0) + '% on Y (at the optimum).' +
          '<br>Higher \u03B1 \u2192 curves get steeper (you\u2019d sacrifice more Y for extra X).' +
          '<br>Diminishing MRS: as you accumulate more X, each extra unit is worth less Y to you.';
      } else if (state.type === 'perfect-subs') {
        label = 'U(x,y) = ' + MT.fmt(state.subA, 1) + 'x + ' + MT.fmt(state.subB, 1) + 'y';
        var subRatio = state.subA / state.subB;
        interp = '<strong>Perfect Substitutes:</strong> Straight lines \u2014 you\u2019re always willing to trade at a fixed rate.' +
          '<br>Each unit of X is worth ' + MT.fmt(state.subA, 2) + ' utils; each unit of Y is worth ' + MT.fmt(state.subB, 2) + ' utils.' +
          '<br>MRS = a/b = ' + MT.fmt(subRatio, 2) + ' (constant): you\u2019d always swap 1 X for ' + MT.fmt(subRatio, 2) + ' Y.' +
          '<br>Think: Coke vs Pepsi for someone who views them as interchangeable.';
      } else {
        label = 'U(x,y) = \\min(x/' + MT.fmt(state.compA, 1) + ',\\; y/' + MT.fmt(state.compB, 1) + ')';
        interp = '<strong>Perfect Complements:</strong> L-shaped \u2014 goods are consumed in a fixed ratio.' +
          '<br>You need ' + MT.fmt(state.compA, 1) + ' unit(s) of X for every ' + MT.fmt(state.compB, 1) + ' unit(s) of Y.' +
          '<br>Extra X without matching Y adds <em>zero</em> utility (and vice versa).' +
          '<br>Think: left shoes and right shoes, or coffee and cream in a fixed recipe.';
      }

      d3.select('#info-11').html(interp);
      MT.updateMath('math-11', label);
    }

    function drawIC(g, uTarget, color, sw, opacity) {
      if (state.type === 'cobb-douglas') {
        var a = state.cdAlpha;
        var xLo = Math.pow(uTarget / Math.pow(maxY, 1 - a), 1 / a);
        var xHi = Math.pow(uTarget / Math.pow(0.3, 1 - a), 1 / a);
        xLo = Math.max(0.3, xLo);
        xHi = Math.min(maxX, xHi);
        if (xLo < xHi) {
          MT.drawCurve(g,
            function (x) { return Math.pow(uTarget / Math.pow(x, a), 1 / (1 - a)); },
            [xLo, xHi], xScale, yScale,
            { color: color, strokeWidth: sw, opacity: opacity, nPoints: 200 });
        }
      } else if (state.type === 'perfect-subs') {
        var sa = state.subA, sb = state.subB;
        var xl = Math.max(0, (uTarget - sb * maxY) / sa);
        var xr = Math.min(maxX, uTarget / sa);
        if (xl < xr) {
          MT.drawCurve(g,
            function (x) { return (uTarget - sa * x) / sb; },
            [xl, xr], xScale, yScale,
            { color: color, strokeWidth: sw, opacity: opacity });
        }
      } else {
        var ca = state.compA, cb = state.compB;
        var cx = uTarget * ca, cy = uTarget * cb;
        if (cx <= maxX && cy <= maxY) {
          g.append('line')
            .attr('x1', xScale(cx)).attr('y1', yScale(cy))
            .attr('x2', xScale(cx)).attr('y2', yScale(maxY))
            .attr('stroke', color).attr('stroke-width', sw).attr('opacity', opacity);
          g.append('line')
            .attr('x1', xScale(cx)).attr('y1', yScale(cy))
            .attr('x2', xScale(maxX)).attr('y2', yScale(cy))
            .attr('stroke', color).attr('stroke-width', sw).attr('opacity', opacity);
        }
      }
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
