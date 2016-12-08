var ElementInspector = Backbone.View.extend({

    className: 'element-inspector',
    
    template: [
        '<label>Cell text</label>',
        '<textarea class="cell-attrs-text"></textarea>',
        '<label>Cell font size</label>',
        '<input type="number" class="cell-attrs-font-size"/>'
    ].join(''),

    events: {
        'change textarea': 'updateCell',
        'change input': 'updateCell'
    },

    render: function(cellView) {

        this._cellView = cellView;
        var cell = this._cellView.model;

        this.$el.html(_.template(this.template)());

        cell.on('remove', function() {
            this.$el.html('');
        }, this);

        var attrs = cell.get('attrs');
        
        if (attrs && attrs.text) {
            this.$('.cell-attrs-text').val(attrs.text.text || '');
        }
        if (attrs && attrs.text) {
            this.$('.cell-attrs-font-size').val(attrs.text['font-size'] || 10);
        }
    },

    updateCell: function() {

        var text = this.$('.cell-attrs-text').val();
        this._cellView.model.attr({ text: { text: text } });
        
        var fontSize = this.$('.cell-attrs-font-size').val();
        this._cellView.model.attr({ text: { 'font-size': parseInt(fontSize, 10) } });
    }
});