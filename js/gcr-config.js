/* gcr-config.js — Loads admin-configured hero image, title, and description
   for GCR category pages. Add to any category page:
     <script src="js/gcr-config.js" data-category="restaurants"></script>
*/
(function() {
  var script = document.currentScript;
  var categoryId = script ? script.dataset.category : null;
  if (!categoryId) return;

  var API = 'https://gar-front-end-data.vercel.app/api/gcr';

  function applyPageConfig(cfg) {
    if (!cfg) return;
    var hero = document.querySelector('.hero');
    if (hero && cfg.hero_image_url) {
      hero.style.background =
        'linear-gradient(rgba(0,0,0,.24), rgba(0,0,0,.44)), url(' + cfg.hero_image_url + ') center/cover no-repeat';
    }
    var h1 = document.querySelector('.hero h1');
    if (h1 && cfg.page_title) h1.textContent = cfg.page_title;
    var p = document.querySelector('.hero p');
    if (p && cfg.page_description) p.textContent = cfg.page_description;
  }

  fetch(API + '/category-page-config/' + categoryId)
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) { if (d && d.config) applyPageConfig(d.config); })
    .catch(function() {});
})();
