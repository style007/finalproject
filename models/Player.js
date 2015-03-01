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
        this.segments.each(function(m) {
            var from = m.get('time');
            var to = parseInt( m.get('time') )+parseInt(m.get('duration'));
            if( ct >= from && ct <= to )
                m.set('current', true);
            else m.set('current', false);
        });
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
            $('#quickSegmentsWrap').append(m.viewSmall.$el);
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
        var $this = this;
        this.player = jwplayer('jwp_cont').setup({
            sources: [{
                    'file': 'http://opencastau.tau.ac.il/static/engage-player/ae3ed072-c8be-44ca-8754-d51cac62c06b/1f0755e3-dce1-4610-b83a-79ebe43db55e/4951.flv'
                }],
            'image': '/events/media/k2/items/cache/5287d60029615676bcf4267b7203b28d_XL.jpg',
            'height': '100%',
            'width': '100%',
            'autostart': 'true',
            'controls': '1'
        });
        this.player.onTime(function (obj) {
            $this.model.set('currentTime', obj.position);
        });
    },
    events: {
        'keyup #search_query': 'onSearchChange'
    },
    render: function () {
    },
    onSearchChange: function() {
        var input = $('#search_query', this.$el);
        this.model.set('q', input.val());
    }
});