---
layout: page
permalink: /research/
title: Research
description: 
years: [2021, 2022]
nav: true
---

<div class="publications">

<!-- Publications and Accepted Work -->
<h3  class="pubyear">Publications and Accepted Work</h3>
{% bibliography -f publications %}

<!-- Working Papers -->
<h3  class="pubyear">Working Papers</h3>
{% bibliography -f wp %}

<!-- Work in Progress --> 
<h3  class="pubyear">Work in Progress</h3>
{% bibliography -f pipeline %}

 <!-- Other Writing --> 
<h3  class="pubyear">Other Publications</h3>
{% bibliography -f other %}
</div>
