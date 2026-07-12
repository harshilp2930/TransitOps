#!/bin/sh
# Environment filter script for git filter-branch

# Map hivashah29@example.com -> hivashah2021@gmail.com
if [ "$GIT_COMMITTER_EMAIL" = "hivashah29@example.com" ]; then
  export GIT_COMMITTER_NAME="hivashah29"
  export GIT_COMMITTER_EMAIL="hivashah2021@gmail.com"
fi
if [ "$GIT_AUTHOR_EMAIL" = "hivashah29@example.com" ]; then
  export GIT_AUTHOR_NAME="hivashah29"
  export GIT_AUTHOR_EMAIL="hivashah2021@gmail.com"
fi

# Map dhiraj217@example.com and dhiraj217@github.com -> dhirajrajai12@gmail.com
if [ "$GIT_COMMITTER_EMAIL" = "dhiraj217@example.com" ] || [ "$GIT_COMMITTER_EMAIL" = "dhiraj217@github.com" ]; then
  export GIT_COMMITTER_NAME="DHIRAJ RAJAI"
  export GIT_COMMITTER_EMAIL="dhirajrajai12@gmail.com"
fi
if [ "$GIT_AUTHOR_EMAIL" = "dhiraj217@example.com" ] || [ "$GIT_AUTHOR_EMAIL" = "dhiraj217@github.com" ]; then
  export GIT_AUTHOR_NAME="DHIRAJ RAJAI"
  export GIT_AUTHOR_EMAIL="dhirajrajai12@gmail.com"
fi

# Map harshilp2930@example.com and harshilp2930@github.com -> 12302130501073@gcet.ac.in (Harshil Patel)
if [ "$GIT_COMMITTER_EMAIL" = "harshilp2930@example.com" ] || [ "$GIT_COMMITTER_EMAIL" = "harshilp2930@github.com" ]; then
  export GIT_COMMITTER_NAME="Harshil Patel"
  export GIT_COMMITTER_EMAIL="12302130501073@gcet.ac.in"
fi
if [ "$GIT_AUTHOR_EMAIL" = "harshilp2930@example.com" ] || [ "$GIT_AUTHOR_EMAIL" = "harshilp2930@github.com" ]; then
  export GIT_AUTHOR_NAME="Harshil Patel"
  export GIT_AUTHOR_EMAIL="12302130501073@gcet.ac.in"
fi

# Map yashpatel826-hub@users.noreply.github.com -> 12302130501064@gcet.ac.in (Yash Ka.Patel)
if [ "$GIT_COMMITTER_EMAIL" = "yashpatel826-hub@users.noreply.github.com" ]; then
  export GIT_COMMITTER_NAME="Yash Ka.Patel"
  export GIT_COMMITTER_EMAIL="12302130501064@gcet.ac.in"
fi
if [ "$GIT_AUTHOR_EMAIL" = "yashpatel826-hub@users.noreply.github.com" ]; then
  export GIT_AUTHOR_NAME="Yash Ka.Patel"
  export GIT_AUTHOR_EMAIL="12302130501064@gcet.ac.in"
fi

# Also ensure any commits already with 12302130501064@gcet.ac.in are named correctly
if [ "$GIT_COMMITTER_EMAIL" = "12302130501064@gcet.ac.in" ]; then
  export GIT_COMMITTER_NAME="Yash Ka.Patel"
  export GIT_COMMITTER_EMAIL="12302130501064@gcet.ac.in"
fi
if [ "$GIT_AUTHOR_EMAIL" = "12302130501064@gcet.ac.in" ]; then
  export GIT_AUTHOR_NAME="Yash Ka.Patel"
  export GIT_AUTHOR_EMAIL="12302130501064@gcet.ac.in"
fi
