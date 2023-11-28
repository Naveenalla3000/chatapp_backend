@echo off

echo Enter the commit message:
set /p msg=""
timeout /t 3 >nul

echo git branches are:
git branch
timeout /t 3 >nul

echo Enter the branch: 
set /p branch=""
timeout /t 3 >nul

git show-ref --verify --quiet "refs/heads/%branch%" >nul 2>&1
if %errorlevel% equ 0 (
  git checkout "%branch%"
) else (
  git checkout -b "%branch%"
)

timeout /t 3 >nul
git add .
timeout /t 3 >nul
git config core.autocrlf false
git config core.eol lf 
git commit -m "%msg%"
timeout /t 3 >nul
git push origin "%branch%" 
timeout /t 3 >nul

cls
echo Commit done Successfully!