var player = {
    url: 'http://opencastau.tau.ac.il/search/episode.json',
    models: {},
    collections: {},
    views: {},
    controller: false,
    view: false,
    instance: {}
};

player.controller = Backbone.Model.extend({
    defaults: {
        id: false,
        loaded: false,
        currentTime: 0,
        currentSegment: false,
        'search-results': false,
        q: ''
    },
    initialize: function () {
        this.segments = new player.collections.VideoSegments();
        this.loadVideo();
        this.listenTo(this, 'change:q', this.loadVideo);
        this.listenTo(this, 'change:currentTime', this.markCurrentSegment);
    },
    markCurrentSegment: function() {
        var $this = this;
        var ct = this.get('currentTime') * 1000;
        var c_m = false;
        this.segments.each(function(m) {
            var from = m.get('time');
            var to = parseInt( m.get('time') )+parseInt(m.get('duration'));
            if( ct >= from && ct <= to ) {
                if( c_m !== false) {
                    //alert('Some1 already marked');
                } else {
                    c_m = m;
                    m.set('current', true);
                }
            } else m.set('current', false);
        });
        
        this.set('currentSegment', c_m);
    },
    loadVideo: function ( ) {
        var $this = this;
        $.ajax({
            url: this.getUrl(),
            data: {fromat: 'json'},
            dataType: 'jsonp',
            jsonp: "jsonp",
            success: function (r) {
                $this.updateData(r);
            }
        });
    },
    updateData: function (r) {
        var sr = r["search-results"];
        if (!this.get('loaded')) {
            this.set(r);
            this.set('loaded', true);
        }

        this.segments.reset();
        if (sr.total > 0)
            this.segments.add(sr.result.segments.segment);
        else this.segments.add(this.get('search-results').result.segments.segment);

        this.segments.each(function (m) {
            $('#segmentsWrap').append(m.viewBig.$el);
        });
        
    },
    getUrl: function () {
        return player.url + '?id=' + this.get('id') + '&q=' + this.get('q');
    }
});

player.view = Backbone.View.extend({
    model: player.controller,
    initialize: function () {
        this.listenTo(this.model, 'change:search-results', this.render);
        this.listenTo(this.model, 'change:currentSegment', this.renderCurrentSegment);
        this.listenTo(this.model, 'change:q', this.renderHasQuery);
        this.player = false;
        if( this.model.get('search-results') !== false )
            this.render();
        
    },
    events: {
        'keyup #search_query': 'onSearchChange'
    },
    renderHasQuery: function() {
        if( this.model.get('q') == '' )
            this.$el.removeClass('has-query');
        else this.$el.addClass('has-query');
    },
    renderCurrentSegment: function() {
        var cs = this.model.get('currentSegment');
        $('#quickSegmentsWrap .cont').html('');
        if( cs === false ) {
            // Clear the area
            return;
        }
        var tpl = _.template($('#segment-tpl').text());
        $('#quickSegmentsWrap  .cont').html( tpl({ model: cs }) );
    },
    render: function () {
        var $this = this;
        var sr = this.model.get('search-results');
        var mp4_file = false;
        _.each(sr.result.mediapackage.media.track, function( t ) {
            if( t.mimetype == 'video/mp4' )
                mp4_file = t.url;
        });
        
        this.player = jwplayer('jwp_cont').setup({
            sources: [{'file': mp4_file}],
            'height': '100%',
            'width': '100%',
            'autostart': 'true',
            'controls': '1'
        });
        this.player.onTime(function (obj) {
            $this.model.set('currentTime', obj.position);
        });
        
        var dateObj = new Date(sr.result.dcCreated);
        $('.mtitle', this.$el).text( sr.result.dcTitle );
        $('.movie_date', this.$el).text( dateObj.toLocaleString() );
    },
    onSearchChange: function() {
        var input = $('#search_query', this.$el);
        this.model.set('q', input.val());
    }
});