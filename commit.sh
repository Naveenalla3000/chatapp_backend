#! bin/bash/zsh
clear
echo "Enter the commit message: "
read -r msg
sleep 3
echo "git branches are: "
git branch
sleep 3
echo "Enter the branch: "
read -r branch
sleep 3
if git show-ref --verify --quiet "refs/heads/$branch"; then
    git checkout "$branch"
else
    git checkout -b "$branch"
fi
sleep 3
git add .
sleep 3
git config core.autocrlf false
git config core.eol lf
git commit -m "$msg"
sleep 3
git push origin "$branch"
sleep 3
echo "Commit done Successfully 🚀 "