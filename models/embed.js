delete jwplayer;

var id = '408c4890-2187-4963-bac4-5d5071238792';
            var _player = null;
            var _playerView = null;
            
jQuery('head').append('<script src="//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.2/underscore-min.js"></script>');
setTimeout( function() {
    jQuery('head').append('<script src="//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min.js"></script>');
}, 1500);

setTimeout( function() {
    jQuery('head').append('<script src="http://jwpsrv.com/library/n_9PjLIeEeSmgQp+lcGdIw.js"></script>');
}, 2000);



setTimeout( function() {
    jQuery('head').append('        <script src="http://asaf.cloud.yo/finalproject/models/Player_embed.js"></script>        <script src="http://asaf.cloud.yo/finalproject/models/VideoSegments_embed.js"></script>        <link rel="stylesheet" type="text/css" href="http://asaf.cloud.yo/finalproject/main_embed.css" />');
}, 3000);

setTimeout( function() {
    jQuery('body').append('        <div id="player">            <div id="playerSearch">                <input type="text" id="search_query" placeholder="Type anything you wanna search......" />            </div>            <div id="segmentsWrap"></div>        </div>        <script type="text/html" id="segment-tpl">            <div class="segment-details">                <div class="segment-text"><div class="segment-thumb"><img src="<%=model.get(\'previews\').preview.$%>" /></div><div class="segment-rating"><%=printSegmentRating(model.get(\'relevance\'))%></div><%=model.get(\'text\')%></div>            </div>            <br class="clear" />        </script>');
}, 4000);

setTimeout( function() {
    var player_id = jQuery('.avPlayerBlock').attr('id');
    
    jQuery('.avPlayerBlock').html('<div id="avID_'+player_id+'" style="width:960px;height:560px;" title="TAU Webcast video player"><a href="rtsp://vod.tau.ac.il:80/vod/_definst_/mp4:events/5784.mp4"><img class="span12" src="/events/media/k2/items/cache/5c8604a837b8c8d1332f565f1134f20b_XL.jpg"></a></div>');
    
    alert('reached');
    /*
    jwplayer('avID_'+player_id).setup({
		sources: [{
			'file': 'rtmp://vod.tau.ac.il:80/vod/_definst_/mp4:events/5784.mp4',
		},{
			'file': 'http://vod.tau.ac.il:80/vod/_definst_/mp4:events/5784.mp4/playlist.m3u8',
		}],
		'rtmp': {
			'bufferlength': 3
		},
		'image': '/events/media/k2/items/cache/5c8604a837b8c8d1332f565f1134f20b_XL.jpg',
		'height': '560',
		'width': '960',
		'autostart': 'false',
                primary: 'html5',
		'controls': '1',
                type: 'mp4'
	});
    */
    jwplayer('avID_'+player_id).setup({
		'file': 'http://opencastau.tau.ac.il/static/engage-player/408c4890-2187-4963-bac4-5d5071238792/d51a7daa-111c-4940-acc2-4fc60d96e760/4951.mp4',
		'image': '/events/media/k2/items/cache/5c8604a837b8c8d1332f565f1134f20b_XL.jpg',
		'type': 'mp4',
		'primary': 'html5'
	});
    _player = new player.controller({
                    id: id
                });
                _playerView = new player.view({
                    model: _player,
                    el: $('#player')
                });
}, 5000);