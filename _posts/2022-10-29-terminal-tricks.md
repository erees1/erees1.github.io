---
title: "My Favourite Terminal Workflow Tricks"
author: Edward Rees
layout: post
---

{% capture toc %}
- [Command line copier](#command-line-copier)
- [Fzf vim opener](#fzf-vim-opener)
- [Fzf tmux session switcher](#fzf-tmux-session-switcher)
- [Custom completions](#custom-completions)
{% endcapture %}

{% capture main %}

<!--summary_start-->

The following are my 4 favourite terminal scripts and shortcuts that I have found useful for optimizing processes and procedures that arise frequently during my day job as a Machine Learning Engineer. These tricks are mostly applicable for zsh / tmux users although the Command line copier is more general. Accusations of over optimization are definitely valid! I have included all the required code along with links to the 'live' versions that live in my [dotfiles repo](https://github.com/erees1/dotfiles) on github.

## Command line copier

Starting with my favourite of the list, this script streamlines the process of copying text from the terminal. It uses the osc52 escape sequence which is supported by most terminals (I use iterm) and allows you to copy text from anywhere, including from remote ssh sessions. This script is quite simple, it reads from stdin (or any number of files given as arguments), wraps the received text contents in the osc52 sequence and then prints it back to the terminal with the result that the text contents is copied to your local clipboard. There exists an excellent vim plugin that I use [vim-oscyank](https://github.com/ojroques/vim-oscyank) which does a similar thing but for yanking inside vim.

```bash
#!/bin/bash
# yk (yank) script - copy stdin to clipboard using osc52 escape sequence
set -euo pipefail

function print_OSC52() {
  esc="\033]52;c;$( printf %s "$1" | head -c $maxlen | base64 | tr -d '\r\n')\a"
  printf $esc
}

buf=$(cat "$@")
buf_len=${#buf}

maxlen=74994
if [[ $buf_len -gt $maxlen ]]; then
    >&2 echo "Input length ($buf_len) longer than max length ($maxlen), \
        output will be truncated"
fi

print_OSC52 "$buf"
>&2 echo "Copied $buf_len characters to clipboard"
```

<div class="code-source" markdown="1">
[Github Source](https://github.com/erees1/dotfiles/blob/main/custom_bins/yk)
</div>


Note to get this to work inside tmux you need to include `set -g set-clipboard on` in your `tmux.conf`, which allows tmux to use your terminal clipboard. I have this script named `yk` visible in my `$PATH` so it can be used as follows:

```zsh
echo "why hello there" | yk
# cmd-v / ctrl-v / tmux paste results in:
why hello there

# Alternatively
yk file1 file2 file3
```

Perhaps the most useful application of this script is to augment the `readlink` command which I very frequently use to get path names (e.g. to use as an argument to a script). I already have the alias `rl="readlink -f"` to get path names, but by including the script below as `rlc` in my `$PATH` I can now automatically copy the path to my clipboard with the command `rlc`.

```bash
#!/bin/bash
# rlc script - like readlink -f but copy the result to the clipboard
set -euo pipefail

path=$(readlink -f $@)
echo $path | yk
echo $path
```

As I use vi mode in zsh and I also use this script such that if I yank something in visual mode it also ends up on my local system clipboard.

```zsh
# Activate vim mode.
bindkey -v

# Yank to the system clipboard
function vi-yank-yk {
    zle vi-yank
   echo "$CUTBUFFER" | yk 2> /dev/null
}

zle -N vi-yank-yk
bindkey -M vicmd 'y' vi-yank-yk
```

## Fzf vim opener

I am a big fan of [fzf](https://github.com/junegunn/fzf) and use it various ways throughout my workflow. In fact both this and the next trick utilize fzf!

Fzf comes with the default binding `ctrl-t` which enables you to complete a command with a path by fuzzy searching the current directory and children. One thing that I want to do often is open a single file in a repository, make some edits and save. This keybinding helps speed up that process by using a modified version of fzf's ctrl-T binding to open a file with vim. I have this command bound to `ctrl-v` in my `.zshrc` and is pretty much the only way I open files with vim.

```zsh
# .zshrc example
function __fsel_files() {
  setopt localoptions pipefail no_aliases 2> /dev/null
  eval find ./ -type f -print | fzf -m "$@" | while read item; do
    echo -n "${(q)item} "
  done
  local ret=$?
  echo
  return $ret
}

function fzf-vim {
    selected=$(__fsel_files)
    if [[ -z "$selected" ]]; then
        zle redisplay
        return 0
    fi
    zle push-line # Clear buffer
    BUFFER="nvim $selected";
    zle accept-line
}
zle -N fzf-vim
bindkey "^v" fzf-vim
```

<div class="code-source" markdown="1">
[Github Source](https://github.com/erees1/dotfiles/blob/main/zsh/common/keybindings.sh#L99)
</div>

This shortcut works in two parts, first a combination of the `find` command and fzf is used to select a file path. Then `nvim <selected filepath>` is inserted into your terminal buffer (as if you had typed it in) and that line is accepted (equivalent to pressing enter on it). The main benefit of setting this up as a zle widget and explicitly writing to your terminal buffer is that the command and the selected filename are then stored in your history which you wouldn't get if you were to simply use `vim $(fzf)`.

Example after pressing `ctrl-v` in my terminal:

<div class="remove-vert-margin">
<img src='/assets/img/blog/aliases/vim1.png'>
</div>

I've included my default fzf options below to show how this prompt is achieved.

```zsh
# in .zshrc
export FZF_DEFAULT_OPTS='--color=16,bg:-1,bg+:15,hl:4,hl+:4,fg:-1,fg+:-1,gutter:-1,pointer:-1,marker:-1,prompt:1 --height 60% --reverse --color border:46 --border=sharp --prompt="➤  " --pointer="➤ " --marker="➤ "'
```

## FZF tmux session switcher

This one is heavily inspired by ThePrimageons ["tmux sessionizer"](https://www.youtube.com/watch?v=bdumjiHabhQ). I use tmux heavily for work and I like to use tmux 'sessions' to isolate different projects that I am concurrently working on. I use git worktrees to work on multiple branches of our main repo at once and this fits nicely with that pattern.

E.g. using this script I can get a list of possible tmux sessions based on directories in my `~git/` directory (and any others I want to include), selecting one will make a new tmux session at that directory with an informative session name. Below is an example of the end result.

<div class="remove-vert-margin">
<img src='/assets/img/blog/aliases/tsesh5.png'>
</div>

I have this script named `tsesh` also on my `$PATH`. If I call `tsesh` with no arguments it will open the fzf window shown above (including the `--popup` flag will open the fzf inside a tmux popup window). I have this bound to `<leader>tab` in my tmux.conf, and to `ctrl-a` in my `.zshrc` (`ctrl-a` is my tmux leader when inside tmux)

```shell
# In tmux.conf
bind Tab run-shell "tsesh --popup"

# In .zshrc
bindkey -s '^a' "tsesh\n"
```

Full script below with an explanation of the key functions after:

```bash
#!/bin/bash

USAGE=$(cat <<-END
Usage: tsesh <PATH>

Tmux session switcher, if a PATH argument is provided will either switch to or
start a new session named after the basename of that path and in that location.
If no PATH is provided a fzf window will be presented from common options.

OPTIONS:
    --popup [use if called from a tmux popup window, changes some fzf options]
END
)
POSITIONAL_ARGS=()
while (( "$#" )); do
    case "$1" in
        -h|--help)
            echo "$USAGE" && exit 1 ;;
        --popup)
            POPUP=true && shift ;;
        --) # end argument parsing
            shift && break ;;
        -*|--*=) # unsupported flags
            echo "Error: Unsupported flag $1" >&2 && exit 1 ;;
        *)
            POSITIONAL_ARGS+=("$1") # save positional arg
            shift ;;
    esac
done

set -- "${POSITIONAL_ARGS[@]}" # restore positional parameters


# Is tmux running and arje we inside a tmux session
is_running=$(ps aux | grep '[t]mux new-session')
if tmux info &> /dev/null; then
    is_inside="true"
fi

# Selection using fzf ---
dir2name(){
    # Set of rules to transform directories into sesh_names
    name="$1"
    sesh_name=$(basename "$name")
    if [[ $name == *"/git/aladdin/"* ]] ; then
        sesh_name="aladdin-$sesh_name"
    fi
    echo "$sesh_name"
}

find_directories(){
    # Responsible for chosing which directories to display
    possible_options="$HOME/git"
    if [ $LOC == "remote" ]; then
        possible_options+=" $HOME/git/aladdin"
    fi
    find  $possible_options -mindepth 1 -maxdepth 1 -type d -not -path '*/.*';
}

tabulate() {
    # Reads a list of directories from find command and processes them to
    # a table for fzf to display, it also prepends all the running tmux sessions
    # to the list so they can also be selected, outputs a colored table
    if [[ $is_inside == "true" ]]; then
        current_session=$(tmux display-message -p '#S')
    fi
    printf "\x1b[1mSession Directory Status\x1b[0m\n"  #Headings
    {
        for name in $(tmux list-sessions | awk '{print $1}' | sed 's/:$//'); do
            status="\x1b[32mrunning\x1b[0m"
            line="-"
            if [[ ! $name == $current_session ]]; then
                printf "\x1b[33m$name \x1b[34m$line\x1b[0m $status\n"
            fi
        done
        while IFS=$'\n' read -r line; do
            name="$(dir2name $line)"
            if ! tmux has-session -t="$name" 2> /dev/null ; then
                # Don't process running ones
                status="create?"
                printf "\x1b[33m$name \x1b[34m$line\x1b[0m $status\n"
            fi
        done | sort -k1,1
    }
}

# This section gets the selected and sesh_name from cmd line of from fzf
# if no cmd line args are provided
if [[ $# -eq 1 ]]; then
    selected=$1
    sesh_name=$(basename $selected)
    if [[ ! -d $selected ]]; then
        selected=$HOME
    fi
else
    fzf_bin="fzf"
    fzf_args="--header-lines=1 --ansi"
    if [[ ! -z $POPUP  && $TERM_PROGRAM == "tmux" ]] ; then
        fzf_bin="fzf-tmux -p 50%,50%"
        fzf_args+=" --border=none --height=100%"
    fi
    selected=$(find_directories | tabulate | column -t -s' '\
        | sed '1s/^/  /' | $fzf_bin $fzf_args )
    sesh_name=$(echo $selected | awk '{ print $1 }')
    selected=$(echo $selected | awk '{ print $2 }')
fi

if [[ -z $selected ]]; then
    exit 0
fi

# Session switching ---

# If tmux is not running at all
if [[ -z $TMUX ]] && [[ -z $is_running ]]; then
    tmux new-session -s $sesh_name -c $selected
    exit 0
fi

# If tmux is running but does not have a session with that name
# create new session but dont attach
if ! tmux has-session -t=$sesh_name 2> /dev/null; then
    tmux new-session -ds $sesh_name -c $selected
fi

if [[ $is_inside == true ]]; then
    # Switching from one session to another when already inside tmux
    tmux switch-client -t $sesh_name
else
    # If tmux is running, has a session with that name but we are not currently attached
    tmux attach -t $sesh_name
fi
```

<div class="code-source" markdown="1">
[Github Source](https://github.com/erees1/dotfiles/blob/main/custom_bins/tsesh)
</div>

This is quite a long one but there are few key functions:

- `find_directories` prints out all the possible directories that I can start a tmux session in by default this is just everything in `~git/` directory and every thing I have in my `~git/aladdin/` directory (which are git worktrees for my repository called `aladdin`). I use the `$LOC` environment variable, which is set in my `.zshrc` to distinguish my remote and local machine as I have folders on my remote machine I don't have on my local one
- `dir2name` extracts the session name from the directory name, mostly just the basename of the directory but there is additional logic for my git worktrees
- `tabulate` converts the directory names from `find_directories` into a table that is sent to fzf using the `dir2name` function. It also appends any running tmux sessions (e.g. that might have been created manually)
- The final section ensures the script works wherever you are calling it from and if tmux is already running or not.

## Custom completions

Zsh allows you to add custom completions to functions and aliases which I have found to be very effective at streamlining my workflow. The following discusses a particular example of using custom completions I have found to be useful.

All our compute jobs are based around a queue system (we use SGE 😩) the up shot of this is that many times throughout the day I run commands that take job ids as inputs. E.g. `qtail` will `tail -f` the log file of a job whilst `qdel` will delete a job. The standard workflow to run any of these would be to first list all running jobs, then find the job id we want to issue the command to, then copy it and the run the relevant command. By adding completions to these queue commands that whole process can be reduced to just one step.

```zsh
#compdef qstat

# AUTOCOMPLETION FOR ZSH
# Reference: https://zsh.sourceforge.io/Doc/Release/Completion-Widgets.html

local -a opts
list="$(/usr/bin/qstat | tail -n +3 | awk '{print $1}' | uniq)"

setopt shwordsplit
for item in $list; do
    # Strip the description of the leading /exp/edwardr/ as
    # all of my jobs have that
    description=${$(qlog $item)#"/exp/edwardr/"}
    opts+=("$item:$description")
done

_describe 'command' opts
```

<div class="code-source" markdown="1">
[Github Source](https://github.com/erees1/dotfiles/blob/main/zsh/completions/_qstat)
</div>

The snippet above adds completion to the `qstat` function (which many of the queue commands are based on). The first step of this process is getting a list of job ids by running `qstat` itself. Then for each job id I also collect the path to the log file (with the `qlog` command) enabling me to identify what the job is running.

The `_describe` function is provided by zsh and takes the `opts` argument which is an array of possible completions. The format `$item:$description` means that `$item` is the thing to be completed and `$description` provides extra info, in this case the log path so that I can identify the job. You could add any potential description here that you wanted. An example of tab completing the `qtail` function is shown below:

<div class="remove-vert-margin">
<img src='/assets/img/blog/aliases/completions2.png'>
</div>

With this setup I save the the compdef snippet above into a file called `_qstat` (name of command to be completed) in a directory called `completions` which I then add to my `fpath` (where ZSH searches for completions) by including `fpath=(<path to>/completions $fpath)` in my `.zshrc`. Any other commands that I want the same completions for I can add by using the builtin zsh `compdef` function.

```zsh
# The functions below are defined in my .zshrc but here I set
# them to use the same completions as qstat defined above
compdef qlog=qstat
compdef qcat=qstat
compdef qexp=qstat
compdef qrecycle=qstat
compdef qtail=qstat
```

That's a wrap! I hope you found this list useful or interesting and hope that it might give some inspiration to fellow over-optimizers on how to tinker your setup for maximum speed!
{% endcapture %}

{% include toc_template.html %}
