@echo off

SETLOCAL ENABLEDELAYEDEXPANSION

SET CP=steal/rhino/mail.jar;funcunit/java/selenium-java-client-driver.jar;steal/rhino/js.jar

SET ARGS=[

for /f "tokens=1,2,3,4,5,6 delims= " %%a in ("%*") do SET ARGS=!ARGS!'%%a','%%b','%%c','%%d','%%e','%%f'

for %%a in (",''=") do ( call set ARGS=%%ARGS:%%~a%% )

for /f "tokens=1*" %%A in ("%ARGS%") do SET ARGS=%%A

SET ARGS=%ARGS%]

set ARGS=%ARGS:\=/%

java -Xss1024k -cp %CP% org.mozilla.javascript.tools.shell.Main -opt -1 -e _args=%ARGS% -e load('funcunit/scripts/run.js')