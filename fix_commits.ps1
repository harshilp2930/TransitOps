$ErrorActionPreference = "Stop"

$git = "C:\Program Files\Git\cmd\git.exe"

# Get current commits
$commit2 = & $git rev-parse HEAD
$commit1 = & $git rev-parse HEAD~1

Write-Host "Re-writing history for $commit1 and $commit2..."

# 1. Checkout the first commit
& $git checkout $commit1

# 2. Amend the first commit (Dhiraj217)
$env:GIT_COMMITTER_NAME="Dhiraj217"
$env:GIT_COMMITTER_EMAIL="dhiraj217@github.com"
& $git commit --amend --author="Dhiraj217 <dhiraj217@github.com>" --no-edit

# 3. Cherry-pick the second commit
& $git cherry-pick $commit2

# 4. Amend the second commit (harshilp2930)
$env:GIT_COMMITTER_NAME="harshilp2930"
$env:GIT_COMMITTER_EMAIL="harshilp2930@github.com"
& $git commit --amend --author="harshilp2930 <harshilp2930@github.com>" --no-edit

# 5. Move main branch to this new HEAD
& $git branch -f main HEAD
& $git checkout main

# 6. Force push
& $git push origin main --force

Write-Host "Done!"
