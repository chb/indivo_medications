/**
 * @tag controllers, home
 * Displays a table of meds.  Lets the user 
 * ["App.Controllers.Med.prototype.form submit" create], 
 * ["App.Controllers.Med.prototype.&#46;edit click" edit],
 * or ["App.Controllers.Med.prototype.&#46;destroy click" destroy] meds.
 */
jQuery.Controller.extend('App.Controllers.MedController',
/* @Static */
{
    onDocument: true
},
/* @Prototype */
{
    /**
     * When the page loads, gets all meds to be displayed.
     */
    load: function(){
        if(!$("#med").length) $(document.body).append($('<div/>').attr('id','med'))
        App.Models.Med.findAll({}, this.callback('list'));
    },
    /**
     * Displays a list of meds and the submit form.
     * @param {Array} meds An array of App.Models.Med objects.
     */
    list: function(meds){
        $('#med').html(this.view('init', {meds:meds} ))
    },
    /**
     * Responds to the create form being submitted by creating a new App.Models.Med.
     * @param {jQuery} el A jQuery wrapped element.
     * @param {Event} ev A jQuery event whose default action is prevented.
     */
    "form submit" : function(el, ev){
        ev.preventDefault();
        new App.Models.Med( el.formParams() ).save();
    },
    /**
     * Listens for meds being created.  When a med is created, displays the new med.
     * @param {String} called The open ajax event that was called.
     * @param {Event} med The new med.
     */
    "med.created subscribe": function(called, med){
		$("#med tbody").append( this.view("list", {meds:[med]}) )
        jQuery("#med form input[type!=submit]").val(""); //clear old vals
    },
    /**
     * Creates and places the edit interface.
     * @param {jQuery} el The med's edit link element.
     */
    '.edit click' : function(el){
        var med = el.closest('.med').model();
        med.elements().html(this.view('edit', med))
    },
    /**
     * Removes the edit interface.
     * @param {jQuery} el The med's cancel link element.
     */
    '.cancel click': function(el){
        this.show(el.closest('.med').model());
    },
    /**
     * Updates the med from the edit values.
     */
    '.update click': function(el){
        var $med = el.closest('.med'); 
        $med.model().update( $med.formParams()  )
    },
    /**
     * Listens for updated meds.  When a med is updated, 
     * update's its display.
     */
    'med.updated subscribe' : function(called, med){
        this.show(med);
    },
    /**
     * Shows a med's information.
     */
    show: function(med){
        med.elements().html(this.view('show',med))
    },
    /**
     *  Handle's clicking on a med's destroy link.
     */
    '.destroy click' : function(el){
        if(confirm("Are you sure you want to destroy?"))
            el.closest('.med').model().destroy();
    },
    /**
     *  Listens for meds being destroyed and removes them from being displayed.
     */
    "med.destroyed subscribe" : function(called, med){
        med.elements().remove();  //removes ALL elements
    }
});