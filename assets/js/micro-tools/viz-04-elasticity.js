/* Viz 4 — The Elasticity Explorer
   Two modes: arc elasticity (two draggable points) and
   point elasticity (one draggable point).
   Default demand: Q = 1000 − 10P  (clean: unit elastic at midpoint P=50).
   Students can adjust intercept and slope.                             */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = {
      mode: 'arc',   // 'arc' or 'point'
      a: 1000, b: 10,
      ptA: null, ptB: null, ptSingle: null
    };

    function resetPoints() {
      var pMax = state.a / state.b;
      state.ptA = { P: pMax * 0.25, Q: state.a - state.b * (pMax * 0.25) };
      state.ptB = { P: pMax * 0.65, Q: state.a - state.b * (pMax * 0.65) };
      state.ptSingle = { P: pMax * 0.4, Q: state.a - state.b * (pMax * 0.4) };
    }
    resetPoints();

    /* Controls */
    MT.addDropdown('controls-04', {
      label: 'Elasticity concept',
      value: 'arc',
      options: [
        { value: 'arc',   label: 'Arc elasticity (two points)' },
        { value: 'point', label: 'Point elasticity (one point)' }
      ],
      onChange: function (v) { state.mode = v; render(); }
    });

    var sliders = {};
    sliders.a = MT.addSlider('controls-04', {
      label: 'Demand intercept (a)', min: 200, max: 2000, value: 1000, step: 50,
      onChange: function (v) { state.a = v; resetPoints(); render(); }
    });

    sliders.b = MT.addSlider('controls-04', {
      label: 'Demand slope (b)', min: 2, max: 30, value: 10, step: 1,
      onChange: function (v) { state.b = v; resetPoints(); render(); }
    });

    var chart, xScale, yScale, dynamicG;

    function setup() {
      chart  = MT.createChart('chart-04');
      xScale = d3.scaleLinear().domain([0, state.a * 1.05]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, (state.a / state.b) * 1.05]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();

      MT.drawAxes(chart, xScale, yScale, 'Quantity', 'Price ($)');

      /* Demand curve */
      MT.drawCurve(chart.plotArea,
        function (q) { return (state.a - q) / state.b; },
        [0, state.a], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5 });

      /* Elasticity colour bar */
      drawElasticityBar(chart, colors);

      dynamicG = chart.plotArea.append('g');

      if (state.mode === 'arc') {
        drawArcMode(colors);
      } else {
        drawPointMode(colors);
      }
    }

    /* ---- Elasticity colour bar along top ---- */
    function drawElasticityBar(ch, colors) {
      var barY = -18, barH = 10, n = 60;
      var a = state.a, b = state.b;
      for (var i = 0; i < n; i++) {
        var q = (a / n) * (i + 0.5);
        var p = (a - q) / b;
        if (p <= 0) continue;
        var eps = Math.abs(b * (p / q));
        var hue = eps > 1 ? 210 : eps < 1 ? 0 : 60;
        var sat = Math.min(80, Math.abs(eps - 1) * 50 + 40);
        ch.plotArea.append('rect')
          .attr('x', xScale(a / n * i)).attr('y', barY)
          .attr('width', xScale(a / n) - xScale(0) + 1).attr('height', barH)
          .attr('fill', 'hsl(' + hue + ',' + sat + '%,50%)').attr('opacity', 0.7);
      }
      var fs = '9px';
      ch.plotArea.append('text').attr('x', xScale(a * 0.12)).attr('y', barY - 3)
        .style('fill', colors.text).style('font-size', fs).attr('text-anchor', 'middle').text('|\u03B5|>1 elastic');
      ch.plotArea.append('text').attr('x', xScale(a * 0.5)).attr('y', barY - 3)
        .style('fill', colors.text).style('font-size', fs).attr('text-anchor', 'middle').text('|\u03B5|=1');
      ch.plotArea.append('text').attr('x', xScale(a * 0.88)).attr('y', barY - 3)
        .style('fill', colors.text).style('font-size', fs).attr('text-anchor', 'middle').text('|\u03B5|<1 inelastic');
    }

    /* ---- Arc elasticity mode ---- */
    function drawArcMode(colors) {
      var ptA = state.ptA, ptB = state.ptB;
      var a = state.a, b = state.b;

      dynamicG.selectAll('*').remove();

      /* Segment A—B */
      dynamicG.append('line')
        .attr('x1', xScale(ptA.Q)).attr('y1', yScale(ptA.P))
        .attr('x2', xScale(ptB.Q)).attr('y2', yScale(ptB.P))
        .attr('stroke', colors.highlight).attr('stroke-width', 2).attr('stroke-dasharray', '4,3');

      addDrag(dynamicG, ptA, colors.equilibrium, 'A', function (p, q) {
        ptA.P = p; ptA.Q = q; drawArcMode(colors);
      });
      addDrag(dynamicG, ptB, colors.supply, 'B', function (p, q) {
        ptB.P = p; ptB.Q = q; drawArcMode(colors);
      });

      var dP = ptB.P - ptA.P, dQ = ptB.Q - ptA.Q;
      var midP = (ptA.P + ptB.P) / 2, midQ = (ptA.Q + ptB.Q) / 2;
      var arcE = (dP !== 0 && midP !== 0 && midQ !== 0) ? (dQ / midQ) / (dP / midP) : NaN;

      function cls(e) {
        var ae = Math.abs(e);
        if (!isFinite(ae)) return '';
        return ae > 1.05 ? 'elastic' : ae < 0.95 ? 'inelastic' : '\u2248 unit elastic';
      }

      d3.select('#info-04').html(
        '<strong>Arc elasticity (A\u2194B):</strong> ' + MT.fmt(arcE, 3) +
        '  (' + cls(arcE) + ')' +
        '<br>A: P=' + MT.fmt(ptA.P, 1) + ', Q=' + MT.fmt(ptA.Q, 0) +
        '<br>B: P=' + MT.fmt(ptB.P, 1) + ', Q=' + MT.fmt(ptB.Q, 0)
      );

      MT.updateMath('math-04',
        '\\varepsilon = \\frac{\\Delta Q / \\bar{Q}}{\\Delta P / \\bar{P}} = ' +
        '\\frac{' + MT.fmt(dQ, 0) + '/' + MT.fmt(midQ, 0) + '}{' +
        MT.fmt(dP, 1) + '/' + MT.fmt(midP, 1) + '} = ' + MT.fmt(arcE, 3));
    }

    /* ---- Point elasticity mode ---- */
    function drawPointMode(colors) {
      var pt = state.ptSingle;
      var a = state.a, b = state.b;

      dynamicG.selectAll('*').remove();

      addDrag(dynamicG, pt, colors.equilibrium, '', function (p, q) {
        pt.P = p; pt.Q = q; drawPointMode(colors);
      });

      /* dQ/dP for linear demand Q = a − bP is −b */
      var eps = pt.Q > 0 ? (-b) * (pt.P / pt.Q) : NaN;

      function cls(e) {
        var ae = Math.abs(e);
        if (!isFinite(ae)) return '';
        return ae > 1.05 ? 'elastic' : ae < 0.95 ? 'inelastic' : '\u2248 unit elastic';
      }

      d3.select('#info-04').html(
        '<strong>Point elasticity:</strong> ' + MT.fmt(eps, 3) +
        '  (' + cls(eps) + ')' +
        '<br>P = ' + MT.fmt(pt.P, 1) + ', Q = ' + MT.fmt(pt.Q, 0) +
        '<br>dQ/dP = ' + (-b)
      );

      MT.updateMath('math-04',
        '\\varepsilon = \\frac{dQ}{dP}\\cdot\\frac{P}{Q} = ' +
        '(' + (-b) + ')\\cdot\\frac{' + MT.fmt(pt.P, 1) + '}{' + MT.fmt(pt.Q, 0) + '} = ' +
        MT.fmt(eps, 3));
    }

    /* ---- Drag helper ---- */
    function addDrag(g, pt, color, label, cb) {
      var c = g.append('circle')
        .attr('cx', xScale(pt.Q)).attr('cy', yScale(pt.P))
        .attr('r', 8).attr('fill', color)
        .attr('stroke', '#fff').attr('stroke-width', 2)
        .attr('cursor', 'grab').attr('class', 'drag-point');

      if (label) {
        g.append('text')
          .attr('x', xScale(pt.Q) + 12).attr('y', yScale(pt.P) - 10)
          .style('fill', color).style('font-size', '12px').style('font-weight', 'bold')
          .style('pointer-events', 'none').text(label);
      }

      c.call(d3.drag().on('drag', function (event) {
        var a = state.a, b = state.b;
        var q = xScale.invert(event.x);
        q = Math.max(1, Math.min(a - 1, q));
        var p = (a - q) / b;
        if (p <= 0) return;
        cb(p, q);
      }));
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
