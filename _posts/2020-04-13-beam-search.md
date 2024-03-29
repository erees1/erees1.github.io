---
title: The Beam Search Algorithm
author: Edward Rees
layout: post
published: false
---


{% capture toc %}
- [Language Modelling](#language-modelling)
- [Greedy Search Decoder](#greedy-search-decoder)
- [Beam Search Decoder](#beam-search-decoder)
- [Experiments](#experiments)
- [Conclusion](#conclusion)
- [References](#references)
{% endcapture %}

{% capture main %}

<!--summary_start-->

In this post I will discuss the beam search algorithm in the
context of language modelling. First I will set out more generally the problem that
beam search algorithm tries to solve and then I discuss some simple experiments using dummy data that compare the effectiveness of the beam search algorithm to a greedy search.

## Language Modelling

Language modelling involves modelling probabilities of word sequences, which mathematically, can be denoted by considering the joint probability of a sequence of words $ \mathbf{w} $ of length $l$ as:

$$
p(\mathbf{w}) = p(w_1, w_2, w_3, \dots w_{l})
$$

Consider the problems of: English to French translation, question answering and image captioning. These problems all belong to a class of similar natural language problems which can be addressed using conditional language modelling. In essence tackling any of these problems involves answering the same question:

> _What is the most likely sequence of words given some input?_

Note that these sorts of problems are not restricted to just words, one could, for example be trying to predict a sequence of numbers (such as stock prices), but for simplicity I assume only a sequence of words here.

To create a conditional language model capable of answering the above question we usually want to find the most likely sequence of words given the input or _conditioning context_, although as we shall see finding the **most** likely sequence is usually intractable.

Ignoring the conditioning context for now if we let a sequence of words of length $l$ be denoted as $ \mathbf{w}$ then the probability of that sequence is given simply as:

$$
p(\mathbf{w}) = p(w_1, w_2, w_3, \dots w_{l})
$$

In language modelling it is usual to decompose this probability into a series of conditionals using the chain rule such that the probability of the next word depends upon the words preceding it:

$$
\begin{align*}
p(\mathbf{w}) = p(w_1)\times p(w_2|w_1)\times p(w_3|w_1,w_2)\times \\
\dots \times p(w_l|w_1, w_2,\dots w_{l-1})
\end{align*}
$$

condensing the notation gives:

$$
p(\mathbf{w}) = \prod_{n=1}^{l}p(w_n|w_1, w_2,\dots w_{n-1})
$$

If we are solving a conditional language problem such as thoose given above we need to condition this probability on the conditioning context $ \mathbf{x} $ to obtain the likelihood $p(\mathbf{w} \vert  \mathbf{x})$, simply giving:

$$
p(\mathbf{w}|\mathbf{x}) = \prod_{n=1}^{l}p(w_n|\mathbf{x}, w_1, w_2,\dots w_{n-1}).
$$

Decomposing the probability distribution $p(\mathbf{w} \vert  \mathbf{x})$ in this manner is instructive as this is precisely how common sequence models such as Recurrent Neural Networks work - given a sequence up to a point they will output the probability of the next word as a probability distribution over each word in the vocabulary.

Whilst the sequence model can calculate the probability of the next word in a sequence of words it is the task of the _decoder_ to transform these probability distributions into a final output (e.g. our translated sentence).

In an ideal world we would want to find the most probable sequence of words $\mathbf{w^\star}$ which would be given by:

$$
\DeclareMathOperator*{\argmax}{argmax}
\mathbf{w^\star}= \argmax_{\mathbf{w}} p(\mathbf{w}|\mathbf{x})
$$

however as the vocabulary length can be many thousands or even millions of words long and an exhaustive search is exponential in sequence length this is usually an intractable problem.

## Greedy Search Decoder

The simplest solution to this intractable problem is to perform a greedy search. This approximates finding the most probable sequence $\mathbf{w^\star}$ by iteratively finding the most likely word $\widetilde{w}_i$ given the previous words such that:

$$
\mathbf{\widetilde{w}} = \widetilde{w}_1, \widetilde{w}_2, \widetilde{w}_3, \dots, \widetilde{w}_n
$$

where:

$$
\DeclareMathOperator*{\argmax}{argmax}
\widetilde{w}_i = \argmax_{w_i} p(w_i|\mathbf{x}, \widetilde{w}_1,\dots, \widetilde{w}_{i-1} )
$$

This is obviously non-optimal but is very simple to implement. The code below shows a possible implementation that returns the decoded sequence and its log probability. Here `model` could be a recurrent neural network or some other sequence model that predicts the next word `x` given a previous series of word `X`.

```python
def greedy_search(model):
    '''Decode an output from a model using greedy search'''
    X = []
    p = np.log(1)
    for i in range(sequence_length):
        distribution = model.predict_next(X)
        x = np.argmax(distribution)
        x = np.squeeze(x)
        p += np.log(distribution[x])
        X.append(x)
    return X, p
```

## Beam Search Decoder

A better solution is the beam search algorithm, used for example in [1]. The idea is that instead of taking only the most likely word at each decoding iteration, we instead take the $b$ most likely, where $b$ is termed the _beam width_. As you can see below the implementation is a little more involved but the algorithm essentially amounts to:

1. For each beam predict a probability distribution over all words in the vocabulary of length $v$ given the preceding words in that beam
2. Then find the $b$ most likely sequences (i.e. the probability of the sequence of words in each beam multiplied by the probability of the next word) from the potential candidates across all of the beams (there are $b \times v$ to choose from)
3. Update the beam sequences with the $b$ most likely sequences and repeat until the stopping condition is meet (either a special end of sentence token is predicted or we reach some maximum length)

The key difference is that in step 2, instead of finding the $\text{argmax}$ as in greedy search, we are instead finding:

$$
\DeclareMathOperator*{\kargmax}{kargmax}
\kargmax_{w_i, \beta} p(w_i|\mathbf{x}, w_1^{\beta},\dots, w_{i-1}^{\beta} ) \times p(beam_\beta)
$$

where $\text{kargmax}$ is the $\text{argmax}$ function extented to the top $k$ arguments and $p(beam_\beta)$ is the probability of the sequence of words in beam $\beta$ given by:

$$
\begin{align*}
p(beam_\beta) &= p(w_1^{\beta}, w_2^{\beta},\dots w_{i-1}^{\beta}|\mathbf{x})
\\
&= \prod_{1}^{i-1}p(w_{i-1}^\beta|\mathbf{x}, w_1^{\beta}, w_2^{\beta},\dots w_{i-2}^{\beta})
\end{align*}
$$

where $w_i^\beta$ indicates the $i$'th word in beam $\beta$.

An implementation in python is given below that again returns the $b$ most likely sequences and their log probability.

```python
def beam_search(model, beam_width):
    '''Decode an output from a model using beam search with specified beam_width'''

    # beam_seq keeps track of words in each beam
    beam_seq = np.empty((beam_width, 1), dtype=np.int32)

    # beam_log_probs is the likelihood of each beam
    beam_log_probs = np.zeros((beam_width,1))

    vocab_length = model.vocab_length
    prob_char_given_prev = np.empty((beam_width, vocab_length))

    done = False
    first_char = True
    while not done:

        if first_char:
            prob_first_char = model.predict_next([])
            log_prob_first_char = np.log(prob_first_char)
            top_n, log_p = get_top_n(log_prob_first_char, beam_width)
            beam_seq[:,0] = top_n[0]
            beam_log_probs[:,0] += log_p
            first_char = False
        else:

            for beam in range(beam_width):
                prob_char_given_prev[beam] = model.predict_next(beam_seq[beam])
            log_prob_char_given_prev = np.log(prob_char_given_prev)
            log_prob_char = beam_log_probs + log_prob_char_given_prev
            top_n, log_p = get_top_n(log_prob_char, beam_width)
            beam_seq = np.hstack((beam_seq[top_n[0]], top_n[1].reshape(-1,1)))

            beam_log_probs = log_p.reshape(-1,1)

        if len(beam_seq[0]) == sequence_length:
            done = True

    return beam_seq, beam_log_probs
```

## Experiments

In order to evaluate the benefit of using the beam search algorithm over a greedy search I ran a series of experiments. Rather than training a sequence model on data, in these experiments I used a randomly created conditional probability distribution over a set vocabulary length to simulate a language model with a specified memory, where memory determines the maximum distance between words in a sequence where there is still conditional dependence. Thus under a model with memory of 2:

$$
p(4 \vert 1,2,3) = p(4 \vert 0,3,4) \quad \text{wheras}, \quad p(4\vert 1,2,3) \neq p(4\vert 1,0,3)
$$

Given the generated distribution it is possible to calculate the conditional probability distribution of the next word in the sequence and calculate the probability of an entire sequence.

The full code used to run these experiments can be found [here](https://github.com/erees1/beam-vs-greedy-decoders).

### Experiment 1

First I evaluated how close both a beam search and a greedy search come to decoding the most likely solution.

Calculating the actual most likely solution $\mathbf{w}^\star$ involves performing a very expensive exhaustive search as discussed previously, therefore it was only possible to perform this evaluation for very small vocabulary sizes.

<!-- <div class="image blog">
    <img src="{{ "assets/img/blog/beam-search/decoder-accuracy.png" | relative_url }}" alt="feature-importance" />
    <b>Figure 1</b> - A comparison of beam and greedy search (decoder accuracy defined as $\frac{p(\mathbf{\widetilde{w}})}{p(\mathbf{w}^\star)}$
</div> -->

<div class="l-inset">
{% include html-charts/beam-search/decoder-accuracy.html %}
</div>
<div class='caption text-center'>
    <b>Figure 1</b> - A comparison of beam and greedy search, decoder accuracy defined as $\frac{p(\mathbf{\widetilde{w}})}{p(\mathbf{w}^\star)}$
</div>

Figure 1 was produced by randomly generating 64 probability distributions with a memory of 2 and a sequence length of 3 and then taking the average ratio of the probability of the decoded sequence $p(\mathbf{\widetilde{w}})$to the probability of the optimal sequence $p(\mathbf{w}^\star)$ for both beam and greedy search decoders (using the code above). This process was then repeated for a number of vocab lengths. As shown the beam search was able to come much closer to the optimal solution than the greedy decoder and seemed to offer a c. 10% bump in sequence likelihood over the greedy decoder.

### Experiment 2

In the first experiment the computational expense of finding the actual optimal sequence $p(\mathbf{w}^\star)$ limited the comparison to very small vocab lengths. In order to investigate a larger vocab length I instead compared the probabilities of the sequences generated by beam search and greedy search directly. This was done in the same manner as the above with the exception that 32 probability distributions were generated for each vocab length with a memory of 1 (to enable faster computation).

<div class="row justify-content-md-center">
    <div class='col-md-6 col-sm-6 col-xs-12 text-center no-padding'>
    {% include html-charts/beam-search/ratio-of-beam-to-greedy-temp1.html %}
    </div>
    <div class='col-md-6 col-sm-6 col-xs-12 text-center no-padding'>
    {% include html-charts/beam-search/ratio-of-beam-to-greedy-temp10.html %}
    </div>
</div>

<div class="caption text-center">
    <b>Figure 2</b> - Ratio of probability defined as $\frac{p(\mathbf{\widetilde{w}}_{beam})}{p(\mathbf{\widetilde{w}}_{greed})}$
</div>

In this second experiment it was found that using a beam search algorithm over a greedy search gave a boost of 1-5% in decoded likelihood. Additionally under these conditions the performance boost of increasing the beam width seems to plateau around a beam width of 7/9. The benefit of using a beam search decoder also seemed to increase with the temperature of the underlying sequence distributions.

This modification of the temperature of the distribution was performed by generating $v$ uniformly distributed random numbers in the range (0, 1), multiplying each of these with the temperature parameter and feeding the result through a soft-max function. The effect of increasing the temperature is to skew the distribution towards more likely outputs. A distribution with a higher temperature is likely to better represent the actual probability distribution over words as some words (e.g. the word _the_) appear much more regularly than others.

## Conclusion

We have seen here that using the beam-search algorithm is a computationally cheap way of improving the decoded sequences from a language model.  Although the performance improvement from using the beam search algorithm varies depending on the setting, in all cases investigated here, the improvement seemed to plateau at a beam width between 7-9 suggesting that this width gives you the most "bang for your buck"! It would be interesting to see how the performance of the beam-search algorithm fares as the vocab length is pushed much higher, although unfortunately I currently lack the compute required for such an investigation!

One problem with the beam-search algorithm not touched upon here is that it's outputs tend to lack diversity. This has lead researchers in recent years to move away from them in favour of more complex approaches that generates samples with both high likelihood and diversity.

## References

[1] Sutskever I, Vinyals O, Le Q V. Sequence to sequence learning with neural networks. Adv Neural Inf Process Syst. 2014. - [link](https://arxiv.org/abs/1409.3215)

{% endcapture %}

{% include toc_template.html %}