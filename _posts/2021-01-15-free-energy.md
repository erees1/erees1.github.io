---
title: "Note: Derivation of Free Energy (ELBO) in Variational ML"
author: Edward Rees
layout: post
has_toc: true
published: false
---

{% capture toc %}
- [Derivation](#Derivation)
- [Variational Auto-Encoder Formulation](#VariationalAuto-EncoderFormulation)
- [References / Sources](#ReferencesSources)
{% endcapture %}


{% capture main %}


This note sets out the derivation of the variational free energy $\mathcal{F} (q,\theta)$ which is the lower bound for the log-likelihood of the data $\mathcal{L}(\theta) = log \ P(X \vert \theta)$. This is also known as the evidence and thus variational free energy is often called the Evidence Lower BOund (ELBO). The dependance on $\theta$ is included to highlight that $P$ is often a parametric model, and indeed we are usually interested in maximizing the likelihood $\mathcal{L}(\theta)$ with respect to these parameters.

The free energy is frequently used in cases where a distribution $Q$ over unobserved/latent variables $Z$ is used to approximate the true posterior $P(Z \vert X)$, for instance if this distribution is intractable.

###  1. <a name='Derivation'></a>Derivation

We start by considering the log-likelihood of the data $\mathcal{L}(\theta)$ and explicitly including the latent variables $Z$:

$$
\mathcal{L}(\theta) = log \ P(X \vert \theta) = log \int P(Z,X \vert \theta) \ dZ \ ,
$$

we then introduce some approximating distribution $q(Z)$ which may or may not depend on $X$:

$$
\mathcal{L}(\theta) = log \int P(Z,X \vert \theta) \frac{q(Z)}{q(Z)} dZ \ .
$$

We then use [Jensen's inequality](https://en.wikipedia.org/wiki/Jensen%27s_inequality) to move the logarithm into the integral thus forming the lower bound and arriving at the variational free energy:

$$
\mathcal{L}(\theta)\geq \int q(Z) log \frac{P(Z,X \vert \theta)}{q(Z)} = \mathcal{F}(q, \theta) \ .
$$

Rearranging the free energy lets us arrive at the form commonly used in [Expectation Maximization]() for latent variable models.

$$
\begin{align*}
\mathcal{F}(q, \theta) &= \int log \ \frac{P(Z, X \vert \theta)}{q(z)} \ dZ - \int q(z) \ log \ q(z) \ dZ  \\[5pt]

&= \left< log \ P(Z, X \vert \theta) \right>_{q(Z)} + \mathcal{H}(q)
\end{align*}
$$

###  2. <a name='VariationalAuto-EncoderFormulation'></a>Variational Auto-Encoder Formulation

Earlier we said $q(Z)$ may or may not depend on $X$ and in the case of an auto-encoder $Z$ is indeed constructed from $X$, thus replacing $q(Z)$ with $Q(Z\vert X)$ we get:

$$
\mathcal{F}(q, \theta) = \int Q(Z \vert X) \ log \frac{P(Z,X \vert \theta)}{Q(Z \vert X)} \ ,
$$

applying Bayes rules ($P(Z,X \vert \theta) = P(X \vert Z, \theta)P(Z)$) to the above enables us to derive an alternative form of the free energy.

$$
\begin{align*}
\mathcal F(q, \theta) &= \int Q(Z \vert X) \ log \ P(X \vert Z, \theta) \ dZ + \int Q(Z \vert X) \ log \frac{P(Z)}{Q(Z \vert X)} \\[5pt]
&= \left < log \ P(X \vert Z, \theta) \right>_{Q(Z \vert X)} - \mathcal{D_{KL}}[Q(Z\vert X) \vert \vert P(Z)]
\end{align*}
$$

This formulation is exactly the objective function for a variational auto-encoder where the first term is the reconstruction loss and the second term forces our approximating distribution $Q$ to match the real distribution $P$.

###  3. <a name='ReferencesSources'></a>References / Sources

[Probabilistic and Unsupervised Learning Lecture Notes](http://www.gatsby.ucl.ac.uk/teaching/courses/ml1/slides_COMP0086.pdf) - Peter Orbanz, UCL

[Tutorial on Variational Autoencoders](https://arxiv.org/abs/1606.05908) - Carl Doersch


{% endcapture %}

{% include toc_template.html %}