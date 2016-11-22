define(["mvc/workflow/workflow-globals"],function(a){function b(a){this.collectionType=a,this.isCollection=!0,this.rank=a.split(":").length}$.extend(b.prototype,{append:function(a){return a===NULL_COLLECTION_TYPE_DESCRIPTION?this:a===ANY_COLLECTION_TYPE_DESCRIPTION?otherCollectionType:new b(this.collectionType+":"+a.collectionType)},canMatch:function(a){return a===NULL_COLLECTION_TYPE_DESCRIPTION?!1:a===ANY_COLLECTION_TYPE_DESCRIPTION?!0:a.collectionType==this.collectionType},canMapOver:function(a){if(a===NULL_COLLECTION_TYPE_DESCRIPTION)return!1;if(a===ANY_COLLECTION_TYPE_DESCRIPTION)return!1;if(this.rank<=a.rank)return!1;var b=a.collectionType;return this._endsWith(this.collectionType,b)},effectiveMapOver:function(a){var c=a.collectionType,d=this.collectionType.substring(0,this.collectionType.length-c.length-1);return new b(d)},equal:function(a){return a.collectionType==this.collectionType},toString:function(){return"CollectionType["+this.collectionType+"]"},_endsWith:function(a,b){return-1!==a.indexOf(b,a.length-b.length)}}),NULL_COLLECTION_TYPE_DESCRIPTION={isCollection:!1,canMatch:function(){return!1},canMapOver:function(){return!1},toString:function(){return"NullCollectionType[]"},append:function(a){return a},equal:function(a){return a===this}},ANY_COLLECTION_TYPE_DESCRIPTION={isCollection:!0,canMatch:function(a){return NULL_COLLECTION_TYPE_DESCRIPTION!==a},canMapOver:function(){return!1},toString:function(){return"AnyCollectionType[]"},append:function(){throw"Cannot append to ANY_COLLECTION_TYPE_DESCRIPTION"},equal:function(a){return a===this}};var c=Backbone.Model.extend({initialize:function(a){this.mapOver=a.mapOver||NULL_COLLECTION_TYPE_DESCRIPTION,this.terminal=a.terminal,this.terminal.terminalMapping=this},disableMapOver:function(){this.setMapOver(NULL_COLLECTION_TYPE_DESCRIPTION)},setMapOver:function(a){this.mapOver=a,this.trigger("change")}}),d=Backbone.Model.extend({initialize:function(a){this.element=a.element,this.connectors=[]},connect:function(a){this.connectors.push(a),this.node&&this.node.markChanged()},disconnect:function(a){this.connectors.splice($.inArray(a,this.connectors),1),this.node&&(this.node.markChanged(),this.resetMappingIfNeeded())},redraw:function(){$.each(this.connectors,function(a,b){b.redraw()})},destroy:function(){$.each(this.connectors.slice(),function(a,b){b.destroy()})},destroyInvalidConnections:function(){_.each(this.connectors,function(a){a.destroyIfInvalid()})},setMapOver:function(a){this.multiple||this.mapOver().equal(a)||(this.terminalMapping.setMapOver(a),_.each(this.node.output_terminals,function(b){b.setMapOver(a)}))},mapOver:function(){return this.terminalMapping?this.terminalMapping.mapOver:NULL_COLLECTION_TYPE_DESCRIPTION},isMappedOver:function(){return this.terminalMapping&&this.terminalMapping.mapOver.isCollection},resetMapping:function(){this.terminalMapping.disableMapOver()},resetMappingIfNeeded:function(){}}),e=d.extend({initialize:function(a){d.prototype.initialize.call(this,a),this.datatypes=a.datatypes},resetMappingIfNeeded:function(){this.node.hasConnectedOutputTerminals()||this.node.hasConnectedMappedInputTerminals()||_.each(this.node.mappedInputTerminals(),function(a){a.resetMappingIfNeeded()});var a=!this.node.hasMappedOverInputTerminals();a&&this.resetMapping()},resetMapping:function(){this.terminalMapping.disableMapOver(),_.each(this.connectors,function(a){var b=a.handle2;b&&(b.resetMappingIfNeeded(),a.destroyIfInvalid())})}}),f=d.extend({initialize:function(a){d.prototype.initialize.call(this,a),this.update(a.input)},canAccept:function(a){return this._inputFilled()?!1:this.attachable(a)},resetMappingIfNeeded:function(){var a=this.mapOver();if(a.isCollection){var b=this.node.hasConnectedMappedInputTerminals()||!this.node.hasConnectedOutputTerminals();b&&this.resetMapping()}},resetMapping:function(){this.terminalMapping.disableMapOver(),this.node.hasMappedOverInputTerminals()||_.each(this.node.output_terminals,function(a){a.resetMapping()})},connected:function(){return 0!==this.connectors.length},_inputFilled:function(){var a;return this.connected()?this.multiple?this._collectionAttached()?inputsFilled=!0:a=!1:a=!0:a=!1,a},_collectionAttached:function(){if(this.connected()){var a=this.connectors[0].handle1;return a&&(a.isCollection||a.isMappedOver()||a.datatypes.indexOf("input_collection")>0)?!0:!1}return!1},_mappingConstraints:function(){if(!this.node)return[];var a=this.mapOver();if(a.isCollection)return[a];var b=[];return this.node.hasConnectedOutputTerminals()?b.push(_.first(_.values(this.node.output_terminals)).mapOver()):_.each(this.node.connectedMappedInputTerminals(),function(a){b.push(a.mapOver())}),b},_producesAcceptableDatatype:function(b){for(var c in this.datatypes){var d=this.datatypes[c];if("input"==d)return!0;var e=new Array;if(e=e.concat(b.datatypes),b.node.post_job_actions)for(var f in b.node.post_job_actions){var g=b.node.post_job_actions[f];"ChangeDatatypeAction"!=g.action_type||""!=g.output_name&&g.output_name!=b.name||!g.action_arguments||e.push(g.action_arguments.newtype)}for(var h in e){var i=e[h];if("input"==i||"_sniff_"==i||"input_collection"==i||a.app.isSubType(e[h],d))return!0;if("gate"===d||"lif"===d)return"lif"===i||"gate"===i}}return console.log("No acceptable datatype found."),!1},_otherCollectionType:function(a){var b=NULL_COLLECTION_TYPE_DESCRIPTION;a.isCollection&&(b=a.collectionType);var c=a.mapOver();return c.isCollection&&(b=c.append(b)),b}}),g=f.extend({update:function(a){this.datatypes=a.extensions,this.multiple=a.multiple,this.collection=!1},connect:function(a){f.prototype.connect.call(this,a);var b=a.handle1;if(b){var c=this._otherCollectionType(b);c.isCollection&&this.setMapOver(c)}},attachable:function(a){var b=this._otherCollectionType(a),c=this.mapOver();if(b.isCollection){if(this.multiple)return this.connected()&&!this._collectionAttached()?!1:1==b.rank?this._producesAcceptableDatatype(a):!1;if(c.isCollection&&c.canMatch(b))return this._producesAcceptableDatatype(a);var d=this._mappingConstraints();return d.every(_.bind(b.canMatch,b))?this._producesAcceptableDatatype(a):!1}return c.isCollection?!1:this._producesAcceptableDatatype(a)}}),h=f.extend({update:function(a){this.multiple=!1,this.collection=!0,this.datatypes=a.extensions;var c=[];a.collection_types?_.each(a.collection_types,function(a){c.push(new b(a))}):c.push(ANY_COLLECTION_TYPE_DESCRIPTION),this.collectionTypes=c},connect:function(a){f.prototype.connect.call(this,a);var b=a.handle1;if(b){var c=this._effectiveMapOver(b);this.setMapOver(c)}},_effectiveMapOver:function(a){var b=this.collectionTypes,c=this._otherCollectionType(a),d=_.some(b,function(a){return a.canMatch(c)});if(!d)for(var e in b){var f=b[e],g=c.effectiveMapOver(f);if(g!=NULL_COLLECTION_TYPE_DESCRIPTION)return g}return NULL_COLLECTION_TYPE_DESCRIPTION},_effectiveCollectionTypes:function(){var a=this.mapOver();return _.map(this.collectionTypes,function(b){return a.append(b)})},attachable:function(a){var b=this._otherCollectionType(a);if(b.isCollection){var c=this._effectiveCollectionTypes(),d=this.mapOver(),e=_.some(c,function(a){return a.canMatch(b)});if(e)return this._producesAcceptableDatatype(a);if(d.isCollection)return!1;if(_.some(this.collectionTypes,function(a){return b.canMapOver(a)})){var f=this._effectiveMapOver(a);if(!f.isCollection)return!1;var g=this._mappingConstraints();if(g.every(f.canMatch))return this._producesAcceptableDatatype(a)}}return!1}}),i=d.extend({initialize:function(a){d.prototype.initialize.call(this,a),this.datatypes=a.datatypes,this.collectionType=new b(a.collection_type),this.isCollection=!0},update:function(a){var c=new b(a.collection_type);c.collectionType!=this.collectionType.collectionType&&_.each(this.connectors,function(a){a.destroy()}),this.collectionType=c}});return{InputTerminal:g,OutputTerminal:e,InputCollectionTerminal:h,OutputCollectionTerminal:i,TerminalMapping:c,CollectionTypeDescription:b,NULL_COLLECTION_TYPE_DESCRIPTION:NULL_COLLECTION_TYPE_DESCRIPTION,ANY_COLLECTION_TYPE_DESCRIPTION:ANY_COLLECTION_TYPE_DESCRIPTION}});
//# sourceMappingURL=../../../maps/mvc/workflow/workflow-terminals.js.map