module("med")

test("meds present", function(){

        S.open("//app/app.html");
		S('.med').exists(function(){
			ok(true, "meds present");
	    });

})

test("create meds", function(){
    S("[name=name]").type("Ice")
    S("[name=description]").type("Cold Water")
    S("[type=submit]").click()
    S('.med:nth-child(2)').exists()
    S('.med:nth-child(2) td:first').text(function(text){
        ok(text.match(/Ice/), "Typed Ice");
    });
})

test("edit meds", function(){
    S('.med:nth-child(2) a.edit').click();
    S(".med input[name=name]").type(" Water")
    S(".med input[name=description]").type("\b\b\b\b\bTap Water")
    S(".update").click()
    S('.med:nth-child(2) .edit').exists()
    S('.med:nth-child(2) td:first').text(function(text){
        ok(text.match(/Ice Water/), "Typed Ice Water");
    });
    S('.med:nth-child(2) td:nth-child(2)').text(function(text){
        ok(text.match(/Cold Tap Water/), "Typed Ice Water");
    });
})


test("destroy", function(){
    S(".med:nth-child(2) .destroy").click()
    S.confirm(true);
	S('.med:nth-child(2)').missing()
    ok("destroyed");
});