/**
 * @hide
 * Sets the following functions and attributes to be added
 * to Class or Constructor static (class) functions.
 * <h3>Example</h3>
 * @codestart
 * /* @static *|
 * @codeend
 */
DocumentJS.Pair.extend('DocumentJS.Static',
{starts_scope: true,
},
{
    
	add_parent : function(scope){
        
        var scope_class=  scope.Class.shortName.toLowerCase();
        this.parent = scope_class == 'class' || scope_class == 'constructor' ? scope : scope.parent;
        if(scope_class != "file" && this.parent){
            this.parent.add(this);
        }
            
    },
    name: 'static'
});