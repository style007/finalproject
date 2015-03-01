player.models.VideoSegment = Backbone.Model.extend({
    sync: function () {
        return false;
    },
    defaults: {current: false},
    initialize: function () {
        var $this = this;
        this.listenTo(this, 'remove', function () {
            $this.destroy();
        })
        this.viewSmall = new player.views.VideoSegment({model: this});
        this.viewBig = new player.views.VideoSegment({model: this});
    }
});

player.views.VideoSegment = Backbone.View.extend({
    model: player.models.VideoSegment,
    tagName: 'div',
    className: 'segment',
    events: {
        'click': 'goToSegment'
    },
    initialize: function () {
        var $this = this;
        this.listenTo(this.model, 'remove', function ( ) {
            $this.destroyView();
        });
        this.listenTo(this.model, 'change:current', this.renderCurrent);
        this.render();
    },
    destroyView: function () {
        this.unbind(); // Unbind all local event bindings
        this.model.unbind('change', this.render, this); // Unbind reference to the model

        this.remove(); // Remove view from DOM

        delete this.$el; // Delete the jQuery wrapped object variable
        delete this.el; // Delete the variable reference to this node
    },
    render: function () {
        var tpl = _.template($('#segment-tpl').text());
        this.$el.html(tpl({model: this.model}));
    },
    renderCurrent: function () {
        if (this.model.get('current'))
            this.$el.addClass('current');
        else
            this.$el.removeClass('current');
    },
    goToSegment: function () {
        _playerView.player.seek(this.model.get('time') / 1000);
    }
});

player.collections.VideoSegments = Backbone.Collection.extend({
    model: player.models.VideoSegment,
    sync: function () {
        return false;
    },
    initialize: function () {
        this.on('reset', function (col, opts) {
            _.each(opts.previousModels, function (model) {
                model.trigger('remove');
            });
        });
    }
});