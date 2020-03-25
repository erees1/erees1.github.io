---
title: Beam Search - Probabilistic Motivation
author: Edward Rees
layout: post
draft: false
mathjax: true
short_description: Discussion of the beam search as an approximate solution to conditional language modelling.
---
## Introduction

In this post I aim to discuss the probabilistic motivation behind the beam search algorithm and why it is preferable to a greedy search.

### Recap: Conditional Language Modelling

In a condititional lanauge we model we are generally trying to find the probablitiy of some sequence of words $ \boldsymbol{w} $ given some input, known as the conditioning context, $ \boldsymbol{x} $. For example we could be trying to:

* Translate an English input sentance into a French sentence
* Come up with the answer to a question
* Caption an image

The probablity of the sequence of words given the conditioning context is given by $p(\boldsymbol{w} \vert  \boldsymbol{x})$. In language modelling it is usual to decompose this probability using the chain rule. Omitting the conditional for brevity $p(\boldsymbol{w})$ is given by:

$$
\begin{align}
p(\boldsymbol{w}) &= p(w_1)\times p(w_2|w_1)\times p(w_3|w_1,w_2)\times \dots \times p(w_l|w_1, w_2,\dots w_{l-1})
\\
&= \prod_{n=1}^{l}p(w_n|w_1, w_2,\dots w_{n-1})
\end{align}
$$

where $l$ is the length of the sequence of words in $\boldsymbol{w}$.

Adding in the conditional context $\boldsymbol{x}$, we arrive at:

$$
p(\boldsymbol{w}|\boldsymbol{x}) = \prod_{n=1}^{l}p(w_n|\boldsymbol{x}, w_1, w_2,\dots w_{n-1})
$$

To come up with an output given an input we typically need to find the most probable $\boldsymbol{w^\star}$ given by:

$$
\DeclareMathOperator*{\argmax}{argmax}
\boldsymbol{w^\star}= \argmax_{\boldsymbol{w}} p(\boldsymbol{w}|\boldsymbol{x})
$$

however this is usually an intractable problem so it is necessary to come up with an approximation.

### Solutions to the conditional probability

One possible solution (the simplest) is to perform a greedy search.  This approximates this 


