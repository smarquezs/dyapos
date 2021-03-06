define(["Component"], function(Component) {
	return Backbone.View.extend({
		el : document.getElementById("new-component-box"),

		events : {
			"click #btn-add-title" : "addTitle",
			"click #btn-add-subtitle" : "addSubtitle",
			"click #btn-add-body" : "addBody",
			"click #btn-add-image" : "addImage",
			"click #btn-add-video" : "addVideo",
		},

		addTitle : function() {
			Component.insert({
				"type" : "text",
				"text_type" : "title",
				"font_size" : 3,
				"pos_x" : clicked_inside_slide_point.left,
				"pos_y" : clicked_inside_slide_point.top,
				"content" : title_default_text,
			});
		},

		addSubtitle : function() {
			Component.insert({
				"type" : "text",
				"text_type" : "subtitle",
				"font_size" : 2,
				"pos_x" : clicked_inside_slide_point.left,
				"pos_y" : clicked_inside_slide_point.top,
				"content" : subtitle_default_text,
			});
		},

		addBody : function() {
			Component.insert({
				"type" : "text",
				"text_type" : "body",
				"font_size" : 1,
				"pos_x" : clicked_inside_slide_point.left,
				"pos_y" : clicked_inside_slide_point.top,
				"content" : body_default_text,
			});
		},
		
		addImage : function(){
			$("#add-image-box").foundation("reveal", "open");
			Component.hideNewComponentBox();
		},
		
		addVideo : function(){
			$("#add-video-box").foundation("reveal", "open");
			Component.hideNewComponentBox();			
		},
	});
});
