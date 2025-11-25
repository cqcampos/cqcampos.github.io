---
layout: page
permalink: /research-test/
title: Research Test
description: Testing the new card layout
years: [2021, 2022]
nav: false
---

<div class="publications">

<!-- Publications and Accepted Work -->
<h3  class="pubyear">Publications and Accepted Work</h3>
{% bibliography -f publications --template bib_card %}

<!-- Working Papers -->
<h3  class="pubyear">Working Papers</h3>
{% bibliography -f wp --template bib_card %}

</div>

<script>
    // Abstract Toggle Script
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.abstract-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cardContent = btn.closest('.paper-content');
                const abstract = cardContent.querySelector('.paper-abstract');
                if (abstract) {
                    abstract.classList.toggle('show');
                }
            });
        });
    });
</script>
