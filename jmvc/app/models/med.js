/**
 * @tag models, home
 * Wraps backend med services.  Enables 
 * [App.Models.Med.static.findAll retrieving],
 * [App.Models.Med.static.update updating],
 * [App.Models.Med.static.destroy destroying], and
 * [App.Models.Med.static.create creating] meds.
 */
$.Model.extend('App.Models.Med',
/* @Static */
{
    /**
     * Retrieves meds data from your backend services.
     * @param {Object} params params that might refine your results.
     * @param {Function} success a callback function that returns wrapped med objects.
     * @param {Function} error a callback function for an error in the ajax request.
     */
    findAll : function(params, success, error){
        $.ajax({
            url: '/apps/medications/meds/',
            type: 'get',
            dataType: 'json',
            data: params,
            success: this.callback(['wrapMany',success]),
			error: error,
            fixture: "//app/fixtures/meds.json.get" //calculates the fixture path from the url and type.
        })
    },
    /**
     * Updates a med's data.
     * @param {String} id A unique id representing your med.
     * @param {Object} attrs Data to update your med with.
     * @param {Function} success a callback function that indicates a successful update.
     * @param {Function} error a callback that should be called with an object of errors.
     */
    update : function(id, attrs, success, error){
        $.ajax({
            url: '/meds/'+id,
            type: 'put',
            dataType: 'json',
            data: attrs,
            success: success,
			error: error,
            fixture: "-restUpdate" //uses $.fixture.restUpdate for response.
            
        })
    },
    /**
     * Destroys a med's data.
     * @param {String} id A unique id representing your med.
     * @param {Function} success a callback function that indicates a successful destroy.
     * @param {Function} error a callback that should be called with an object of errors.
     */
    destroy : function(id, success, error){
        $.ajax({
            url: '/meds/'+id,
            type: 'delete',
            dataType: 'json',
            success: success,
			error: error,
            fixture:"-restDestroy" //uses $.fixture.restDestroy for response.
        })
    },
    /**
     * Creates a med.
     * @param {Object} attrs A med's attributes.
     * @param {Function} success a callback function that indicates a successful create.  The data that comes back must have an ID property.
     * @param {Function} error a callback that should be called with an object of errors.
     */
    create : function(attrs, success, error){
        $.ajax({
            url: '/meds',
            type: 'post',
            dataType: 'json',
            success: success,
			error: error,
            data: attrs,
            fixture: "-restCreate" //uses $.fixture.restCreate for response.
        })
    }
},
/* @Prototype */
{})