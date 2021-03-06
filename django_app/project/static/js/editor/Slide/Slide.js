define(["Component", "Mode", "SlideModel", "SlidesListView", "SlidesMapView", "module", "exports"], function(Component, Mode, SlideModel, SlidesListView, SlidesMapView, module, exports) {

	//Load all (slides and components when editor is opened)
	var loadAll = function() {
		if (!is_anonymous) {
			//Load from server

			slides.sync("read", slides, {
				success : function(data) {
					console.log("Data received from server: ");
					console.log(data);
					//If presentation doesn't have any slides (first time opened)
					if (data.length === 0) {
						//Insert first slide
						insert();
					} else {
						slides = new SlideCollection(data);
						for ( i = 0; i < slides.length; i++) {
							for ( j = 0; j < slides.at(i).get("components").length; j++) {
								slides.at(i).get("components").at(j).toHTML();
							}
						}
						changeSelected(slides.at(0).cid);

						slides_list_view = new SlidesListView({ collection : slides });
						slides_list_view.render();
						slides_map_view = new SlidesMapView({ collection : slides });
						slides_map_view.render();
						setTimeout(loadThumbnails, 3000);
					}
				}
			});
		} else {
			//Load from local web storage
			if (localStorage.slides === undefined || localStorage.slides === "[]") {
				// If it is the first time the editor is opened, so create a first slide
				insert();
			} else {
				slides = new SlideCollection(JSON.parse(localStorage.slides));
				for ( i = 0; i < slides.length; i++) {
					for ( j = 0; j < slides.at(i).get("components").length; j++) {
						slides.at(i).get("components").at(j).toHTML();
					}
				}
				changeSelected(slides.at(0).cid);

				slides_list_view = new SlidesListView({ collection : slides });
				slides_list_view.render();
				slides_map_view = new SlidesMapView({ collection : slides });
				slides_map_view.render();
				setTimeout(loadThumbnails, 3000);
			}
		}
	};

	//Insert a new slide
	var insert = function(data) {
		if (data === null) {
			//If the first Slide is inserted manually
			if (slides.length === 0) {
				slides.add(new SlideModel());
			} else {
				// If it isn't the first slide, calculate coordinates based on the last slide
				slides.add(new SlideModel({
					pos_x : parseInt(slides.at(slides.length - 1).get("pos_x"), 10) + 1000,
					pos_y : parseInt(slides.at(slides.length - 1).get("pos_y"), 10),
					number : slides.length
				}));
			}
		} else {
			//If data is loaded from the server or local web storage
			slides.add(new SlideModel(data));
		}

		position = slides.length - 1;
		cid = slides.at(position).cid;

		if (slides.last().isNew() && !is_anonymous) {
			//Save the last inserted slide to the database
			slides.last().save();
		}

		changeSelected(cid);
	};

	//Change the selected slide
	var changeSelected = function(cid) {
		var from = slides.indexOf(slides.get(selected_slide));
		selected_slide = cid;
		selected_slide_position = slides.indexOf(slides.get(cid));
		moveToSlide(from, selected_slide_position);
	};

	var moveToSlide = function(from, to) {
		$input_scale.value = slides.at(to).get("scale");
		$input_rotation_z.value = slides.at(to).get("rotation_z");
		$input_rotation_x.value = slides.at(to).get("rotation_x");
		$input_rotation_y.value = slides.at(to).get("rotation_y");
		slide_options_box_view.hide();
		impress().goto(slides.at(to).cid);

		//Change to slide edit mode
		Mode.goToSlideEditMode();
	};

	var goNext = function() {
		console.log("Go to next");
		var next = slides.get(selected_slide).get("number") + 1;
		next = next < slides.length ? slides.where({number:next})[0].cid : slides.where({number:0})[0].cid;
		selected_slide = next;
		impress().goto(next);
	};

	var goPrevious = function() {
		console.log("Go to previous");
		var previous = slides.get(selected_slide).get("number") - 1;
		previous = previous >= 0 ? slides.where({number:previous})[0].cid : slides.where({number:slides.length-1})[0].cid;
		selected_slide = previous;
		impress().goto(previous);
	};

	var changePosition = function(cid, pos_x, pos_y) {
		var slide = document.getElementById(cid);
		slide.dataset.x = pos_x;
		slide.dataset.y = pos_y;
		impress().initStep(document.getElementById(cid));

		slides.get(cid).set({
			"pos_x" : pos_x,
			"pos_y" : pos_y
		});
	};

	// Change the order of the slides
	var updateSlidesOrder = function() {

		$("#slides-list > .slide-mini").each(function(index) {
			var cid = this.id.replace("slide-", "");
			slides.get(cid).set("number", index);
		});

	};

	var loadThumbnails = function() {
		slides.each(function(slide) {
			slide.updateThumbnail();
		});
	};

	var saveAllToLocalStorage = function() {
		setTimeout(function() {
			localStorage.slides = JSON.stringify(slides.toJSON());
			saveAllToLocalStorage();
		}, 5000);
	};

	// Event functions

	var onClick = function(event) {
		console.log("event: slide click");
		selected_slide = event.target.id;
		$("#" + selected_slide).addClass("selected");
		$(".step").removeClass("active");
		$("#" + selected_slide).addClass("active");
		slide_options_box_view.show();
	};

	var onClickDeleteBtnSlideMini = function(event) {
		event.stopPropagation();
		$(".tooltip").css("display", "none");

		var cid = event.currentTarget.id.replace("delete-", "");
		deleteSlide(cid);
	};

	var onMousedown = function(event) {
		event.stopPropagation();
		if (event.target.classList[0] == "step") {
			$(".step").removeClass("selected");
			clicked_slide = event.target;
			clicked_slide.classList.add("selected");
			console.log("mousedown on slide");
			last_x = event.clientX;
			last_y = event.clientY;
			transform_style = event.target.style[css_transform];
			slide_trans3d = event.target.style[css_transform].split("translate3d");
			slide_trans3d = slide_trans3d[slide_trans3d.length - 1];
			slide_trans3d = translate3DToArray(slide_trans3d);

			document.addEventListener("mousemove", onMove);
			document.addEventListener("mouseup", onMouseup);
		}
	};

	var onMove = function(event) {
		event.stopPropagation();
		var movement = 7;

		//get the difference from last position to this position
		var deltaX = last_x - event.clientX;
		var deltaY = last_y - event.clientY;

		//check which direction had the highest amplitude and then figure out direction by checking if the value is greater or less than zero

		if (deltaX > 0) {
			// If the movement is to left
			slide_trans3d[0] = parseInt(slide_trans3d[0], 10) - movement;
		} else if (deltaX < 0) {
			// If the movement is to right
			slide_trans3d[0] = parseInt(slide_trans3d[0], 10) + movement;
		}

		if (deltaY > 0) {
			// If the movement is to up
			slide_trans3d[1] = parseInt(slide_trans3d[1], 10) - movement;
		} else if (deltaY < 0) {
			// If the movement is to down
			slide_trans3d[1] = parseInt(slide_trans3d[1], 10) + movement;
		}

		last_x = event.clientX;
		last_y = event.clientY;

		// apply movement to CSS style
		transform_style = transform_style.replace(/translate3d\(.+?\)/g, "translate3d(" + slide_trans3d[0] + "px," + slide_trans3d[1] + "px,0px)");
		clicked_slide.style[css_transform] = transform_style;
	};

	var onMouseup = function(event) {
		event.stopPropagation();
		console.log("mouseup slide");
		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseup", onMouseup);
		clicked_slide.dataset.x = slide_trans3d[0];
		clicked_slide.dataset.y = slide_trans3d[1];
		impress().initStep(clicked_slide);
		changePosition(clicked_slide.id, clicked_slide.dataset.x, clicked_slide.dataset.y);
	};

	var onClickInsideSlide = function(event) {
		event.stopPropagation();
		console.log("event: click on slide");
		var offSet = $(this).offset();

		// Set a global variable to store the inside point where the slide was clicked
		clicked_inside_slide_point = {
			"left" : parseFloat(event.clientX - $(this).offset().left),
			"top" : parseFloat(event.clientY - $(this).offset().top),
		};

		console.log("Clicked on point: " + clicked_inside_slide_point.left + " " + clicked_inside_slide_point.top);

		Component.deselectAll();
		Component.showNewComponentBox();
	};

	var onKeyup = function(event) {
		event.stopPropagation();

		switch( event.keyCode ) {
			case 33:
			// pg up
			case 37:
			// left
			case 38:
				// up
				goPrevious();
				break;
			case 9:
			// tab
			case 32:
			// space
			case 34:
			// pg down
			case 39:
			// right
			case 40:
				// down
				goNext();
				break;
			case 27:
				//Escape
				Mode.exitFromPreviewMode();
				break;
		}

		event.preventDefault();

	};
	
	exports.loadAll = loadAll;
	exports.insert = insert;
	exports.changeSelected = changeSelected;
	exports.changePosition = changePosition;
	exports.updateSlidesOrder = updateSlidesOrder;
	exports.moveToSlide = moveToSlide;
	exports.loadThumbnails = loadThumbnails;
	exports.saveAllToLocalStorage = saveAllToLocalStorage;
	exports.goNext = goNext;
	exports.goPrevious = goPrevious;
	exports.onClick = onClick;
	exports.onMousedown = onMousedown;
	exports.onClickDeleteBtnSlideMini = onClickDeleteBtnSlideMini;
	exports.onMove = onMove;
	exports.vonMouseup = onMouseup;
	exports.onClickInsideSlide = onClickInsideSlide;
	exports.onKeyup = onKeyup;

});
