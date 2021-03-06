(function(){
  if (!document.body.addEventListener || !document.body.setAttribute || !document.body.querySelector) {
    return
  }

  var options, encode, getFullPath, getMeta, getPageAttributes, page, _Drop, target, drop, dropUl, locationsCSSMap, locationStyle, colorStyle, placesMap, placesOrder, i, addPlace, setUpPlaceLink, updatePlaces, updateColors, updateLocationStyle, updateDrop, update, setOptions, prevLocation;

  options = INSTALL_OPTIONS;
  encode = encodeURIComponent;

  getFullPath = function(path) {
    var a = document.createElement('a');
    a.href = path;
    return a.href;
  };

  getMeta = function(selector, property, isURL) {
    var el, value;

    value = null;

    if (document.head && (el = document.head.querySelector(selector))) {
      value = el.getAttribute(property);

      if (isURL) {
        value = getFullPath(value);
      }
    }

    return value;
  };

  getPageAttributes = function() {
    var page = {
      url: window.location.protocol + '//' + window.location.hostname + window.location.pathname,
      title: document.title,
      description: getMeta('meta[name="description"][content], meta[property="og:description"][content]', 'content'),
      image: getMeta('meta[property="og:image"][content]', 'content', true)
    };

    page.url = getMeta('meta[rel="canonical"][href]', 'href', true) || page.url;
    page.url = getMeta('meta[property="og:url"][content]', 'content', true) || page.url;

    page.title = getMeta('meta[property="og:title"][content]', 'content') || page.title;

    return page;
  };

  page = getPageAttributes();

  _Drop = Drop.createContext({
    classPrefix: 'eager-share-app'
  });

  target = document.createElement('a');
  target.className = 'eager-share-app-target';
  target.innerHTML = '<i class="eager-share-app-icon-share"></i><span>Share...</span>';

  // iOS :hover CSS hack
  target.addEventListener('touchstart', function(){}, false);

  document.body.appendChild(target);

  locationsCSSMap = {
    'left-edge': {
      dropPosition: 'bottom left',
      targetCSS: 'left: 0; top: 60px'
    },
    'right-edge': {
      dropPosition: 'bottom right',
      targetCSS: 'right: 0; top: 60px'
    },
    'top-left-corner': {
      dropPosition: 'bottom left',
      targetCSS: 'top: 30px; left: 30px'
    },
    'top-right-corner': {
      dropPosition: 'bottom right',
      targetCSS: 'top: 30px; right: 30px'
    },
    'bottom-left-corner': {
      dropPosition: 'top left',
      targetCSS: 'bottom: 30px; left: 30px'
    },
    'bottom-right-corner': {
      dropPosition: 'top right',
      targetCSS: 'bottom: 30px; right: 30px'
    }
  };

  locationStyle = document.createElement('style');
  document.body.appendChild(locationStyle);

  colorStyle = document.createElement('style');
  document.body.appendChild(colorStyle);

  updateDrop = function() {
    if (drop){
      drop.destroy();
    }

    prevLocation = options.location;

    drop = new _Drop({
      target: target,
      classes: 'eager-share-app',
      openOn: 'click',
      position: locationsCSSMap[options.location].dropPosition,
      constrainToWindow: true,
      constrainToScrollParent: false,
      content: '<ul></ul>'
    });

    // iOS :hover CSS hack
    drop.drop.addEventListener('touchstart', function(){}, false);

    dropUl = drop.drop.querySelector('ul');
  };

  placesMap = {
    twitter: {
      label: 'Twitter',
      href: 'https://twitter.com/home?status=' + encode(
        (page.description ? page.description + ' ' :
          (page.title ? page.title + ' ': '')
        ) +
        page.url
      )
    },
    facebook: {
      label: 'Facebook',
      href: 'https://facebook.com/sharer.php?u=' + encode(page.url)
    },
    google: {
      label: 'Google+',
      href: 'https://plus.google.com/share?url=' + encode(page.url)
    },
    pinterest: {
      label: 'Pinterest',
      href: '' +
        'http://pinterest.com/pin/create/button/' +
          '?url=' + encode(page.url) +
          (page.image ? '&media=' + encode(page.image) : '') +
          '&description=' + encode(page.description || page.title)
    },
    email: {
      label: 'Email',
      href: 'mailto:?subject=' + encode(page.title) + '&body=' + encode((page.description ? page.description + ' ' : '') + page.url)
    }
  };

  placesOrder = [
    'twitter', 'facebook', 'google', 'pinterest', 'email'
  ];

  addPlace = function(place) {
    var li, a, text;

    li = document.createElement('li');
    a = document.createElement('a');

    a.className = 'eager-share-app-icon-' + place;
    a.setAttribute('href', placesMap[place].href);

    text = document.createTextNode(placesMap[place].label);
    a.appendChild(text);
    li.appendChild(a);

    if (place === 'email') {
      a.setAttribute('target', placesMap[place].target);
    } else {
      setUpPlaceLink(a);
    }

    dropUl.appendChild(li);
  };

  setUpPlaceLink = function(link) {
    link.addEventListener('click', function(event){
      var height, left, top, width, popUpWindow, interval;

      event.preventDefault();

      width = 800;
      height = 500;
      left = (screen.width / 2) - (width / 2);
      top = (screen.height / 2) - (height / 2);

      popUpWindow = window.open(link.getAttribute('href'), 'popupwindow', 'scrollbars=yes,width=' + width + ',height=' + height + ',top=' + top + ',left=' + left);
      popUpWindow.focus();

      interval = setInterval(function(){
        try {
          if (popUpWindow.closed) {
            drop.close();
            clearInterval(interval);
          }
        } catch (error) {}
      }, 100);
    });
  };

  updatePlaces = function() {
    var placesCount;

    dropUl.innerHTML = '';

    placesCount = 0;

    for (i = 0; i < placesOrder.length; i++) {
      if (options.places[placesOrder[i]]) {
        addPlace(placesOrder[i]);
        placesCount += 1;
      }
    }

    target.setAttribute('eager-share-app-places-count', placesCount);
    drop.drop.setAttribute('eager-share-app-places-count', placesCount);
  };

  updateColors = function() {
    if (options.useCustomColors) {
      colorStyle.innerHTML = (
      ' .eager-share-app-element a, .eager-share-app-element a:hover {' +
      '    background: ' + options.colors.accent + '!important;' +
      ' }' +
      ' .eager-share-app-element a, .eager-share-app-element a:before {' +
      '   color: #fff !important' +
      ' }' +
      ' .eager-share-app-element a:hover {' +
      '    box-shadow: inset 0 0 0 999em rgba(0, 0, 0, .3) !important' +
      ' }' +
      ' .eager-share-app-target, .eager-share-app-target:hover, .eager-share-app-target:active {' +
      '    background: ' + options.colors.shareIconBackground + '!important;' +
      '    color: ' + options.colors.shareIconText + '!important' +
      ' }' +
      '');
    } else {
      colorStyle.innerHTML = '';
    }
  };

  updateLocationStyle = function() {
    locationStyle.innerHTML = '.eager-share-app-target {' + locationsCSSMap[options.location].targetCSS + '}';
  };

  update = function() {
    if (!prevLocation || prevLocation !== options.location){
      updateDrop();
      updateLocationStyle();
    }

    updatePlaces();
    updateColors();
  };

  update();

  setOptions = function(opts) {
    options = opts;

    update();
  };

  window.EagerShareApp = {
    setOptions: setOptions
  };
})();
