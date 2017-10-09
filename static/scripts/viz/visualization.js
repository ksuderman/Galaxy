define(["libs/underscore","mvc/dataset/data","viz/trackster/util","utils/config","mvc/grid/grid-view","mvc/ui/ui-tabs","mvc/ui/ui-misc"],function(a,b,c,d,e,f){var g={toJSON:function(){var b=this,c={};return a.each(b.constructor.to_json_keys,function(a){var d=b.get(a);a in b.constructor.to_json_mappers&&(d=b.constructor.to_json_mappers[a](d,b)),c[a]=d}),c}},h=function(a,b){var c=new e({url_base:Galaxy.root+"visualization/list_history_datasets",filters:a,dict_format:!0,embedded:!0}),d=new e({url_base:Galaxy.root+"visualization/list_library_datasets",dict_format:!0,embedded:!0}),g=new f.View;g.add({id:"histories",title:"Histories",$el:$("<div/>").append(c.$el)}),g.add({id:"libraries",title:"Libraries",$el:$("<div/>").append(d.$el)}),Galaxy.modal.show({title:"Select datasets for new tracks",body:g.$el,closing_events:!0,buttons:{Cancel:function(){Galaxy.modal.hide()},Add:function(){var a=[];g.$("input.grid-row-select-checkbox[name=id]:checked").each(function(){window.console.log($(this).val()),a[a.length]=$.ajax({url:Galaxy.root+"api/datasets/"+$(this).val(),dataType:"json",data:{data_type:"track_config",hda_ldda:"histories"==g.current()?"hda":"ldda"}})}),$.when.apply($,a).then(function(){var a=arguments[0]instanceof Array?$.map(arguments,function(a){return a[0]}):[arguments[0]];b(a)}),Galaxy.modal.hide()}}})},i=function(a){this.default_font=void 0!==a?a:"9px Monaco, Lucida Console, monospace",this.dummy_canvas=this.new_canvas(),this.dummy_context=this.dummy_canvas.getContext("2d"),this.dummy_context.font=this.default_font,this.char_width_px=this.dummy_context.measureText("A").width,this.patterns={},this.load_pattern("right_strand","/visualization/strand_right.png"),this.load_pattern("left_strand","/visualization/strand_left.png"),this.load_pattern("right_strand_inv","/visualization/strand_right_inv.png"),this.load_pattern("left_strand_inv","/visualization/strand_left_inv.png")};a.extend(i.prototype,{load_pattern:function(a,b){var c=this.patterns,d=this.dummy_context,e=new Image;e.src=Galaxy.root+"static/images"+b,e.onload=function(){c[a]=d.createPattern(e,"repeat")}},get_pattern:function(a){return this.patterns[a]},new_canvas:function(){var a=$("<canvas/>")[0];return a.manager=this,a}});var j=Backbone.Model.extend({defaults:{num_elements:20,obj_cache:null,key_ary:null},initialize:function(){this.clear()},get_elt:function(b){var c=this.attributes.obj_cache,d=this.attributes.key_ary,e=b.toString(),f=a.indexOf(d,function(a){return a.toString()===e});return-1!==f&&(c[e].stale?(d.splice(f,1),delete c[e]):this.move_key_to_end(b,f)),c[e]},set_elt:function(a,b){var c=this.attributes.obj_cache,d=this.attributes.key_ary,e=a.toString(),f=this.attributes.num_elements;if(!c[e]){if(d.length>=f){var g=d.shift();delete c[g.toString()]}d.push(a)}return c[e]=b,b},move_key_to_end:function(a,b){this.attributes.key_ary.splice(b,1),this.attributes.key_ary.push(a)},clear:function(){this.attributes.obj_cache={},this.attributes.key_ary=[]},size:function(){return this.attributes.key_ary.length},most_recently_added:function(){return 0===this.size()?null:this.attributes.key_ary[this.attributes.key_ary.length-1]}}),k=j.extend({defaults:a.extend({},j.prototype.defaults,{dataset:null,genome:null,init_data:null,min_region_size:200,filters_manager:null,data_type:"data",data_mode_compatible:function(){return!0},can_subset:function(){return!1}}),initialize:function(){j.prototype.initialize.call(this);var a=this.get("init_data");a&&this.add_data(a)},add_data:function(b){this.get("num_elements")<b.length&&this.set("num_elements",b.length);var c=this;a.each(b,function(a){c.set_data(a.region,a)})},data_is_ready:function(){var a=this.get("dataset"),b=$.Deferred(),d="raw_data"===this.get("data_type")?"state":"data"===this.get("data_type")?"converted_datasets_state":"error",e=new c.ServerStateDeferred({ajax_settings:{url:this.get("dataset").url(),data:{hda_ldda:a.get("hda_ldda"),data_type:d},dataType:"json"},interval:5e3,success_fn:function(a){return"pending"!==a}});return $.when(e.go()).then(function(a){b.resolve("ok"===a||"data"===a)}),b},search_features:function(a){var b=this.get("dataset"),c={query:a,hda_ldda:b.get("hda_ldda"),data_type:"features"};return $.getJSON(b.url(),c)},load_data:function(a,b,c,d){var e=this.get("dataset"),f={data_type:this.get("data_type"),chrom:a.get("chrom"),low:a.get("start"),high:a.get("end"),mode:b,resolution:c,hda_ldda:e.get("hda_ldda")};$.extend(f,d);var g=this.get("filters_manager");if(g){for(var h=[],i=g.filters,j=0;j<i.length;j++)h.push(i[j].name);f.filter_cols=JSON.stringify(h)}var k=this,l=$.getJSON(e.url(),f,function(b){b.region=a,k.set_data(a,b)});return this.set_data(a,l),l},get_data:function(a,b,d,e){var f=this.get_elt(a);if(f&&(c.is_deferred(f)||this.get("data_mode_compatible")(f,b)))return f;for(var g,h,i=this.get("key_ary"),j=this.get("obj_cache"),k=0;k<i.length;k++)if(g=i[k],g.contains(a)&&(h=!0,f=j[g.toString()],c.is_deferred(f)||this.get("data_mode_compatible")(f,b)&&this.get("can_subset")(f))){if(this.move_key_to_end(g,k),!c.is_deferred(f)){var l=this.subset_entry(f,a);this.set_data(a,l),f=l}return f}if(!h&&a.length()<this.attributes.min_region_size){a=a.copy();var m=this.most_recently_added();!m||a.get("start")>m.get("start")?a.set("end",a.get("start")+this.attributes.min_region_size):a.set("start",a.get("end")-this.attributes.min_region_size),a.set("genome",this.attributes.genome),a.trim()}return this.load_data(a,b,d,e)},set_data:function(a,b){this.set_elt(a,b)},DEEP_DATA_REQ:"deep",BROAD_DATA_REQ:"breadth",get_more_data:function(a,b,c,d,e){var f=this._mark_stale(a);if(!f||!this.get("data_mode_compatible")(f,b))return void console.log("ERROR: problem with getting more data: current data is not compatible");var g=a.get("start");e===this.DEEP_DATA_REQ?$.extend(d,{start_val:f.data.length+1}):e===this.BROAD_DATA_REQ&&(g=(f.max_high?f.max_high:f.data[f.data.length-1][2])+1);var h=a.copy().set("start",g),i=this,j=this.load_data(h,b,c,d),k=$.Deferred();return this.set_data(a,k),$.when(j).then(function(b){b.data&&(b.data=f.data.concat(b.data),b.max_low&&(b.max_low=f.max_low),b.message&&(b.message=b.message.replace(/[0-9]+/,b.data.length))),i.set_data(a,b),k.resolve(b)}),k},can_get_more_detailed_data:function(a){var b=this.get_elt(a);return"bigwig"===b.dataset_type&&b.data.length<8e3},get_more_detailed_data:function(a,b,c,d,e){var f=this._mark_stale(a);return f?(e||(e={}),"bigwig"===f.dataset_type&&(e.num_samples=1e3*d),this.load_data(a,b,c,e)):void console.log("ERROR getting more detailed data: no current data")},_mark_stale:function(a){var b=this.get_elt(a);return b||console.log("ERROR: no data to mark as stale: ",this.get("dataset"),a.toString()),b.stale=!0,b},get_genome_wide_data:function(b){var c=this,d=!0,e=a.map(b.get("chroms_info").chrom_info,function(a){var b=c.get_elt(new n({chrom:a.chrom,start:0,end:a.len}));return b||(d=!1),b});if(d)return e;var f=$.Deferred();return $.getJSON(this.get("dataset").url(),{data_type:"genome_data"},function(a){c.add_data(a.data),f.resolve(a.data)}),f},subset_entry:function(b,c){var d={bigwig:function(b,c){return a.filter(b,function(a){return a[0]>=c.get("start")&&a[0]<=c.get("end")})},refseq:function(a,c){var d=c.get("start")-b.region.get("start");return b.data.slice(d,d+c.length())}},e=b.data;return!b.region.same(c)&&b.dataset_type in d&&(e=d[b.dataset_type](b.data,c)),{region:c,data:e,dataset_type:b.dataset_type}}}),l=k.extend({initialize:function(a){var b=new Backbone.Model;b.urlRoot=a.data_url,this.set("dataset",b)},load_data:function(a,b,c,d){return a.length()<=1e5?k.prototype.load_data.call(this,a,b,c,d):{data:null,region:a}}}),m=Backbone.Model.extend({defaults:{name:null,key:null,chroms_info:null},initialize:function(a){this.id=a.dbkey},get_chroms_info:function(){return this.attributes.chroms_info.chrom_info},get_chrom_region:function(b){var c=a.find(this.get_chroms_info(),function(a){return a.chrom===b});return new n({chrom:c.chrom,end:c.len})},get_chrom_len:function(b){return a.find(this.get_chroms_info(),function(a){return a.chrom===b}).len}}),n=Backbone.Model.extend({defaults:{chrom:null,start:0,end:0,str_val:null,genome:null},same:function(a){return this.attributes.chrom===a.get("chrom")&&this.attributes.start===a.get("start")&&this.attributes.end===a.get("end")},initialize:function(a){if(a.from_str){var b=a.from_str.split(":"),c=b[0],d=b[1].split("-");this.set({chrom:c,start:parseInt(d[0],10),end:parseInt(d[1],10)})}this.attributes.str_val=this.get("chrom")+":"+this.get("start")+"-"+this.get("end"),this.on("change",function(){this.attributes.str_val=this.get("chrom")+":"+this.get("start")+"-"+this.get("end")},this)},copy:function(){return new n({chrom:this.get("chrom"),start:this.get("start"),end:this.get("end")})},length:function(){return this.get("end")-this.get("start")},toString:function(){return this.attributes.str_val},toJSON:function(){return{chrom:this.get("chrom"),start:this.get("start"),end:this.get("end")}},compute_overlap:function(a){var b,c=this.get("chrom"),d=a.get("chrom"),e=this.get("start"),f=a.get("start"),g=this.get("end"),h=a.get("end");return c&&d&&c!==d?n.overlap_results.DIF_CHROMS:b=f>e?f>g?n.overlap_results.BEFORE:h>g?n.overlap_results.OVERLAP_START:n.overlap_results.CONTAINS:e>f?e>h?n.overlap_results.AFTER:h>=g?n.overlap_results.CONTAINED_BY:n.overlap_results.OVERLAP_END:g>=h?n.overlap_results.CONTAINS:n.overlap_results.CONTAINED_BY},trim:function(){if(this.attributes.start<0&&(this.attributes.start=0),this.attributes.genome){var a=this.attributes.genome.get_chrom_len(this.attributes.chrom);this.attributes.end>a&&(this.attributes.end=a-1)}return this},contains:function(a){return this.compute_overlap(a)===n.overlap_results.CONTAINS},overlaps:function(b){return 0===a.intersection([this.compute_overlap(b)],[n.overlap_results.DIF_CHROMS,n.overlap_results.BEFORE,n.overlap_results.AFTER]).length}},{overlap_results:{DIF_CHROMS:1e3,BEFORE:1001,CONTAINS:1002,OVERLAP_START:1003,OVERLAP_END:1004,CONTAINED_BY:1005,AFTER:1006}}),o=Backbone.Collection.extend({model:n}),p=Backbone.Model.extend({defaults:{region:null,note:""},initialize:function(a){this.set("region",new n(a.region))}}),q=Backbone.Collection.extend({model:p}),r=Backbone.Model.extend(g).extend({defaults:{mode:"Auto"},initialize:function(a){this.set("dataset",new b.Dataset(a.dataset));var c=[{key:"name",default_value:this.get("dataset").get("name")},{key:"color"},{key:"min_value",label:"Min Value",type:"float",default_value:0},{key:"max_value",label:"Max Value",type:"float",default_value:1}];this.set("config",d.ConfigSettingCollection.from_models_and_saved_values(c,a.prefs));var e=this.get("preloaded_data");e=e?e.data:[],this.set("data_manager",new k({dataset:this.get("dataset"),init_data:e}))}},{to_json_keys:["track_type","dataset","prefs","mode","filters","tool_state"],to_json_mappers:{prefs:function(b,c){return 0===a.size(b)&&(b={name:c.get("config").get("name").get("value"),color:c.get("config").get("color").get("value")}),b},dataset:function(a){return{id:a.id,hda_ldda:a.get("hda_ldda")}}}}),s=Backbone.Collection.extend({model:r}),t=Backbone.Model.extend({defaults:{title:"",type:""},urlRoot:Galaxy.root+"api/visualizations",save:function(){return $.ajax({url:this.url(),type:"POST",dataType:"json",data:{vis_json:JSON.stringify(this)}})}}),u=t.extend(g).extend({defaults:a.extend({},t.prototype.defaults,{dbkey:"",drawables:null,bookmarks:null,viewport:null}),initialize:function(a){this.set("drawables",new s(a.tracks));var b=[];this.set("config",d.ConfigSettingCollection.from_models_and_saved_values(b,a.prefs)),this.unset("tracks"),this.get("drawables").each(function(a){a.unset("preloaded_data")})},add_tracks:function(a){this.get("drawables").add(a)}},{to_json_keys:["view","viewport","bookmarks"],to_json_mappers:{view:function(a,b){return{obj_type:"View",prefs:{name:b.get("title"),content_visible:!0},drawables:b.get("drawables")}}}}),v=Backbone.Router.extend({initialize:function(a){this.view=a.view,this.route(/([\w]+)$/,"change_location"),this.route(/([\w\+]+\:[\d,]+-[\d,]+)$/,"change_location");var b=this;b.view.on("navigate",function(a){b.navigate(a)})},change_location:function(a){this.view.go_to(a)}});return{BackboneTrack:r,BrowserBookmark:p,BrowserBookmarkCollection:q,Cache:j,CanvasManager:i,Genome:m,GenomeDataManager:k,GenomeRegion:n,GenomeRegionCollection:o,GenomeVisualization:u,GenomeReferenceDataManager:l,TrackBrowserRouter:v,Visualization:t,select_datasets:h}});
//# sourceMappingURL=../../maps/viz/visualization.js.map