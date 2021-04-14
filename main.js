/*
    obrazky mapy.cz:
    http://api4.mapy.cz/img/api/marker/drop-red.png
    http://api4.mapy.cz/img/api/marker/drop-red-asterisk.png
    http://api4.mapy.cz/img/api/marker/dot-red-asterisk.png
    barvy: red, yellow, blue
*/

var obrazekObj = {
    "red": "/images/drop-red.png",
    "red2": "/images/drop-red-asterisk.png",
    "yellow": "/images/drop-yellow.png",
    "yellow2": "/images/drop-yellow-asterisk.png",
    "blue": "/images/drop-blue.png",
    "blue2": "/images/drop-blue-asterisk.png",
    "green": "/images/drop-green.png",
};

var lastClicked = false;
var markers;
var charity;
var regionArray = [];
var obceArray = [];
var obceLokaceArray = [];

// povolit debug v consoli
console.DEBUG = 1

var center = SMap.Coords.fromWGS84(15.3137594, 50.0475797);
var m = new SMap(JAK.gel("m"), center, 8);
// m.addControl(new SMap.Control.Sync()); /* Aby mapa reagovala na změnu velikosti průhledu */
m.addDefaultLayer(SMap.DEF_BASE).enable(); /* Turistický podklad */
m.addDefaultControls();
var mouse = new SMap.Control.Mouse(SMap.MOUSE_PAN | SMap.MOUSE_WHEEL | SMap.MOUSE_ZOOM); /* Ovládání myší */
m.addControl(mouse);

const getPoi = async () => {
    const [lokalityResponse, charityResponse] = await Promise.all([
        fetch('lokality.json'),
        fetch('charity.json')
    ]);

    const lokality = await lokalityResponse.json();
    charity = await charityResponse.json();

    return {
        lokality,
        charity
    };
}

getPoi().then(({ lokality, charity }) => {
    var znacky = [];
    var souradnice = [];
    var obce = "";
    var counter = 0;

    for (var name in lokality) { /* Vyrobit značky */
        var coordsArray = lokality[name].split(",");
        var lat = coordsArray[0].trim();
        var lon = coordsArray[1].trim();
        var c = SMap.Coords.fromWGS84(lon, lat); /* Souřadnice značky, z textového formátu souřadnic */

        const nameArray = name.split(", ");
        region = nameArray[0].trim();
        cleanName = nameArray[1].trim();

        if (
            cleanName.split(" (").length > 1 &&
            cleanName.split(" (")[1].slice(0, -1) === charity[region].name.slice(charity[region].name.length - cleanName.split(" (")[1].slice(0, -1).length)
        ) {
            superCleanName = cleanName.split(" (")[0];
        }
        else superCleanName = cleanName;

        obceArray.push(superCleanName);
        regionArray.push(region);
        obceLokaceArray.push(charity[region].name);
        obce += "<li data-lat = '" + lat + "' data-id ='" + counter++ + "' data-lon = '" + lon + "' title ='" + charity[region].name + "' class ='obec " + charity[region].color + "'>\
                    " + superCleanName + "\
                    <br>\
                    <span>\
                        " + charity[region].name + "\
                    </span>\
                </li>";

        obrazek = obrazekObj[charity[region].color];
        var options = {
            url: obrazek,
            title: superCleanName + " - " + charity[region].name,
            anchor: { left: 10, bottom: 1 }  /* Ukotvení značky za bod uprostřed dole */
        }


        const card = new SMap.Card();
        card.getHeader().innerHTML = "<h2>" + superCleanName + "</h2>";

        const web = getCharityWeb(region);
        if (web) {
            const cardContent = "<br>🌍 <a href='" + web + "' target='_blank' alt='odkaz na web charity' title='odkaz na web charity'>" + web + "</a>";
            card.getBody().innerHTML = cardContent
        }

        const znacka = new SMap.Marker(c, cleanName, options);
        znacka.decorate(SMap.Marker.Feature.Card, card);
        souradnice.push(c);
        znacky.push(znacka);
    }

    list = document.getElementById("list");
    list.innerHTML = obce;

    var vrstva = new SMap.Layer.Marker();     /* Vrstva se značkami */
    /*var shluk = new SMap.Marker.Clusterer(m);
    vrstva.setClusterer(shluk);*/
    m.addLayer(vrstva);                          /* Přidat ji do mapy */
    vrstva.enable();                         /* A povolit */
    for (var i = 0; i < znacky.length; i++) {
        vrstva.addMarker(znacky[i]);
    }

    markers = vrstva.getMarkers();

    var cz = m.computeCenterZoom(souradnice); /* Spočítat pozici mapy tak, aby značky byly vidět */
    m.setCenterZoom(cz[0], cz[1]);

    document.getElementById("search").focus();

    var charitySelect = "<option value ='' disabled selected>Zobrazit seznam obcí dle charity</option>";
    for (var charita in charity) {
        charitySelect += "<option value ='" + charity[charita].name + "'>" + charity[charita].name + "</option>";
    }
    var selectPrint = document.getElementById("selectPrint");
    selectPrint.innerHTML = charitySelect;
});

window.onload = function () {
    list.addEventListener("click", click, false);
};

function searching() {
    var input = document.getElementById("search").value;
    var message = document.getElementById("empty");
    message.style.display = "none";
    var results = 0;
    var filter = false;
    if (input.length > 3 && input.slice(0, 3) === "ch:") {
        filter = true;
        input = input.slice(3);
    }
    var re = new RegExp(input, "i");

    for (var i = 0, obceCount = obceArray.length; i < obceCount; i++) {
        if (filter && obceLokaceArray[i].search(re) !== -1) {
            results++;
            document.getElementsByClassName("obec")[i].style.display = "";
        }
        else if (obceArray[i].search(re) !== -1 /*|| obceLokaceArray[i].search(re) !== -1*/) {
            results++;
            document.getElementsByClassName("obec")[i].style.display = "";
        }
        else {
            document.getElementsByClassName("obec")[i].style.display = "none";
        }
    };
    if (!results) {
        message.style.display = "block";
    }
}

function click(e) {
    var node = e.target;
    if (e.target.localName == "span") {
        node = e.target.parentNode;
    }
    var lat = node.getAttribute('data-lat');
    var lon = node.getAttribute('data-lon');
    var nodeIndex = node.getAttribute('data-id');

    if (lastClicked) {
        var imgUrl = obrazekObj[charity[regionArray[nodeIndex]].color];
        markers[lastClicked].setURL(imgUrl);
    }
    markers[nodeIndex].setURL("/images/drop-selected.png");
    lastClicked = nodeIndex;

    var newCenter = SMap.Coords.fromWGS84(lon, lat);
    m.setCenterZoom(newCenter, 13);
}

function selectCharita(select) {
    var selected = select.value;
    var searchInput = document.getElementById("search");
    searchInput.value = "ch:" + selected;
    searching();
}

function printList() {
    if (document.getElementById("list-wrapper-hidden")) {
        document.getElementById("list-wrapper-hidden").setAttribute("id", "list-wrapper");
    }
    window.print();
}

function printMapOnly() {
    if (document.getElementById("list-wrapper")) {
        document.getElementById("list-wrapper").setAttribute("id", "list-wrapper-hidden");
    }
    else {
        document.getElementById("list-wrapper-hidden").setAttribute("id", "list-wrapper-hidden");
    }
    window.print();
    /*        setTimeout(function() {
            document.getElementById("list-wrapper").setAttribute("id", "list-wrapper");
        }, 2000);*/
}

function showRuler() {
    document.getElementsByClassName("ruler-print")[0].classList.toggle('show');
}

function getCharityWeb(id) {
    return charity[id].web;
}