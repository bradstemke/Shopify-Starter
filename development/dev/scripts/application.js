// application.js

// ============================================================================
// Site
// ============================================================================
var BF        = BF || {};
    BF.Global = BF.Global || {};
    BF.Home = BF.Home || {};

// ============================================================================
// Init
// ============================================================================
$(document).ready(function(){

  new BF.Global.VisualGrid();

  if ( $('.template-index').length ) {
    new BF.Home.HeroSlider();
  }

  if ( $('#lookbook-ss-2016').length ) {
    new BF.Contentful();
  }

  if ( $('.outfit-contentful').length ) {
    BF.OutfitContentful();
  }
});

$(window).load(function () {

  $('body').addClass('showtime');

});

BF.Contentful = function() {
  var lookbookTitle = $('.lookbook-title'),
      publishDate = $('.publish-date'),
      lbImage = $('.lb-image'),
      lbInfo = $('.lookbook-info');

  var client = contentful.createClient({
    accessToken: 'ed9ca9362486be91a3b58e8ebe358dbe5e7d365b161316fbb3bf5314d191c459',
    space: '2br4ovysnzkv'
  });

  // Friendlier names for Content Type id's
  var ContentTypes = {
    Lookbook: '3Aj4hkXArmKOYoU6MQy0SS',
    ImagePost:  '4ThA0VePZSmWYWysw20iic',
  };

  client.entry(ContentTypes.Lookbook)
  .then(function (entry) {
    console.log('lookbook info');
    console.log('Entry:', entry)
    lookbookTitle.text(entry.fields.title);
    publishDate.text(entry.fields.publishedDate);
    lbImage.text(entry.fields.coverImage.id);
    lbInfo.text(entry.fields.lookbookDescription);
  })

  client.space().then(
    function (space) { console.log(space); }
  )

  function createProductTiles (products) {
    return products.map(function (product) {
      var mainImage  = product.fields.mainImage;
      var hoverImage = product.fields.hoverImage || product.fields.mainImage;
      return Templates.ProductTile({
        name:          product.fields.name,
        price:         product.fields.price,
        mainImageURL:  assetUrl(mainImage, { fit: 'pad', w: 420, h: 535 }),
        hoverImageURL: assetUrl(hoverImage, { fit: 'pad', w: 420, h: 535 })
      });
    }).join('');
  }

  /**
   * Return the URL to a particular asset, optionally with query parameters appended.
   */
  function assetUrl (asset, extraParams) {
    try {
      var url = asset.fields.file.url;
      if (extraParams) {
        var queryString = '';
        for (var key in extraParams) {
          queryString += '&' + key + '=' + extraParams[key];
        }
        url += '?' + queryString.substr(1);
      }
      return url;
    } catch (e) {
      console.error('Asset had no file URL:', asset);
      return 'images/show_item_01.jpg';
    }
  }

  client.asset('5RlwihObVCeuEaaWO228wM')
  .then(function (asset) {
    var imageUrl = asset.fields.file.url;
    $('.lookbook-image').attr('src', imageUrl);
  })



};

BF.OutfitContentful = function() {
  var outfitTitle = $('.outfit-title'),
      outfitPrice = $('.outfit-price');

  var client = contentful.createClient({
    accessToken: 'ed9ca9362486be91a3b58e8ebe358dbe5e7d365b161316fbb3bf5314d191c459',
    space: '2br4ovysnzkv'
  });

  // Friendlier names for Content Type id's
  var ContentTypes = {
    Outfit: '4EVwJUdmSA8kCUesYmuUGg'
  };

  client.entry(ContentTypes.Outfit)
  .then(function (entry) {
    console.log('outfit entry');
    console.log('Entry:', entry.fields)
    outfitTitle.text(entry.fields.outfitTitle);
    var productID = entry.fields.productIDs,
        products = {};

    $.ajax({
      type: "GET",
      url: "https://d9ff91942fef6e5c5cc665f2c80ee073:4dfba0332eba872c6ae434ee2bf57456@bf-starter.myshopify.com/admin/products.json?ids=4276797313",
      data: products,
      contentType: "application/json",
      dataType: "jsonp",
      success: function() {
        console.log('Success');
        console.log(this.data);
        console.log(this.url);
      },
      failure: function(){console.log('Failure');}
    });

  })
};

// ============================================================================
// FUNCTIONS
// ============================================================================
    /*
     * Get Viewport Dimensions
     * returns object with viewport dimensions to match css in width and height properties
     * ( source: http://andylangton.co.uk/blog/development/get-viewport-size-width-and-height-javascript )
    */
    function updateViewportDimensions() {
      var w=window,d=document,e=d.documentElement,g=d.getElementsByTagName('body')[0],x=w.innerWidth||e.clientWidth||g.clientWidth,y=w.innerHeight||e.clientHeight||g.clientHeight;
      return { width:x,height:y };
    }

    // setting the viewport width
    var viewport = updateViewportDimensions();

    /*
     * Throttle Resize-triggered Events
     * Wrap your actions in this function to throttle the frequency of firing them off, for better performance, esp. on mobile.
     * ( source: http://stackoverflow.com/questions/2854407/javascript-jquery-window-resize-how-to-fire-after-the-resize-is-completed )
    */
    var waitForFinalEvent = (function () {
      var timers = {};
      return function (callback, ms, uniqueId) {
        if (!uniqueId) { uniqueId = "Don't call this twice without a uniqueId"; }
        if (timers[uniqueId]) { clearTimeout (timers[uniqueId]); }
        timers[uniqueId] = setTimeout(callback, ms);
      };
    })();

    // how long to wait before deciding the resize has stopped, in ms. Around 50-100 should work ok.
    var timeToWaitForLast = 100;

    /*
     * Timing Functions
    */
    var functionStart = window.performance.now();
    var functionComplete = window.performance.now();
    var functionTime = functionComplete - functionStart;

    // console.log('Function Title started at ' + String(functionStart) + ' and ended at ' + String(functionComplete));
    // console.log('Function Title took ' + String(functionTime));

// ============================================================================
// GLOBAL
// ============================================================================
BF.Global.VisualGrid = function() {
  var word  = "grid",
      input = "",
      grid  = $('body');

  document.body.addEventListener('keypress',function(ev){
      input += String.fromCharCode(ev.keyCode);
      if(input == word){
        $(grid).toggleClass('grid-active');
        input = "";
      }
  });
};

BF.Home.HeroSlider = function() {
  $('.home-hero-slider').flexslider({
    controlNav: false,
    directionNav: false,
    dots: false,
    slideshow: true,
    slideshowSpeed: 5000,
    animation: 'fade',
    animationSpeed: 500,
    start: function(){
      $('.home-slide').addClass('loaded');
    },
  });
};