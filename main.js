var player = null;
$(function () {
    initPlayer();
    loadTimespans();
});

function initPlayer() {
    //results.mediapackage.media.track.each
    //if (track.mimetype == 'video/mp4')
        //url = track.url;
        //video for info
        
        
    player = jwplayer('unique_movie_id').setup({
        sources: [{'file': 'http://techslides.com/demos/sample-videos/small.mp4'}],
        'image': '/events/media/k2/items/cache/5287d60029615676bcf4267b7203b28d_XL.jpg',
        'height': '560',
        'width': '960',
        'autostart': 'true',
        'controls': '1'
    });
}

function loadTimespans() {
    initTimespans(xmlData);
    return;
    var xml = 'data/info.xml';
    $.get(xml, function (r) {
        alert('loadeds uccessfuy');

        console.log(x);
    });
}

function initTimespans(data) {
    var x = $.parseXML(data);
    var obj = $(x);
    var segments = obj.find('VideoSegment');
    segments.each(function () {
        printSegment(this);
    });
    calcSegsContDims();
}

function printSegment(s) {
    var d = document.createElement('div');
    var $segment = $(s);
    var seg_id = $segment.attr('id');
    $(d).data('reltime', $segment.find('> MediaTime > MediaRelTimePoint').text());
    $(d).click(function () {
        alert('Should go to : ' + $(this).data('reltime'));
        console.log(s);
    }).addClass('pl').appendTo('.pl_cont').css('background-image', "url('')");
    
    $segment.find('VideoText').each( function() {
        f_spats.push({
            segment_id: seg_id,
            text: $(this).find('Text').text(),
            time: $(this).find('MediaRelTimePoint').text()
        });
    })
    
}

function searchInSpats( q ) {
    var fdata = _.filter(f_spats, function( obj ) {
        return ( obj.text.indexOf( q ) !== -1 );
    });
    
    var ret = {};
    for( k in fdata ) {
        var obj = fdata[k];
        if( typeof ret['segment-'+obj.segment_id] == 'undefined' )
            ret['segment-'+obj.segment_id] = [];
        ret['segment-'+obj.segment_id].push( obj );
    }
    return ret;
}

var f_spats = [];

function calcSegsContDims() {
    var iw = $('.pl').outerWidth(true, true);
    $('.pl_cont').width($('.pl').size() * iw);
}