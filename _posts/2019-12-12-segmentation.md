---
title: Old School Semantic Segmentation of Faces
author: Edward Rees
layout: post
---

# Table of Contents

<div id='TOC' markdown="1">

<!-- TOC depthFrom:2 depthTo:2 -->

- [Intro](#intro)
- [Data cleaning / preparation](#data-cleaning--preparation)
- [Feature Creation](#feature-creation)
- [Modelling](#modelling)
- [Results](#results)
- [Conclusion](#conclusion)
- [References](#references)

<!-- /TOC -->

</div>

## Intro

I have recently completed a data science course at General Assembly in London and for the past 5 weeks in the evenings I have been working on my final project. Cognisant of the rising tide of fake news / fake images and more recently deep fakes on the internet I decided to create an image classifier that could spot whether pictures of faces had been photoshopped or not.

This project ended up bifurcating into two parts with part 1 concerning pixel-based semantic segmentation of images of faces and part 2 developing the classifier to detect fake faces. Part 1 is discussed in this blog post and the full source code can be found on my [github](https://github.com/erees1/faces-segmentation). Part 2 can also be found on my github [here](https://github.com/erees1/faces-fake-vs-real).

This project was primarily based of the work of [1] and utilises the dataset that they collected.

## Data cleaning / preparation

The raw dataset was obtained from the FASSEG Repository [here](http://massimomauro.github.io/FASSEG-repository/) and is presented by [1] in three parts. I used FASSEG V2 and parts of FASSEG V3 for this work. V2 contains only images of faces looking straight on whilst V3 contains images at a variety of head angles. I only used the images that were within +/-15% of straight on from V3. This left me with 80 images in total.

Inspecting the dataset:
<span class="image blog"><img src="{{ "./assets/images/segmentation_post/seg.jpeg" | relative_url }}" alt="" /></span>

There were two main points to tackle before Modelling. The first was to resize the images to a uniform size (necessary if I want to run them through a convolutional net, or create an array containing all of the images) and the second was to clean up the labels (the images on the bottom row above).

### Image loading

To load the images I wrote a series of functions to act as a data pipeline, for full source code click [here](https://github.com/erees1/faces-segmentation/blob/master/src/image_processing.py). I used `os.listdir()` and [scikit-image](https://scikit-image.org) to load each image. As the dataset consists of pairs of images and labels I used the following to code to load the images and correct corresponding labels at the same time.

```python
dir_list = os.listdir(RGB_directory)
imgs = []

for i, img in enumerate(tqdm(dir_list, desc='Loading Images')):

    # Load RGB image
    x = io.imread(RGB_directory + '/' + img)
    imgs.append(x)

    # Load corresponding labels
    y = io.imread(label_directory + '/' + img)
    imgs_labels.append(y)
```

This loads the images as numpy arrays and appends them to a list. I then resized the images and converted them to one large array of size `(n_images, img_width, img_height, 3)`. I then went through some preprocessing steps to get the images in a state suitable for modelling.

### Image resizing

I wanted to maintain the aspect ratio of the images when resizing so I implemented a set of functions that scaled the image such that the largest dimension was equal the size required then padded the other dimension with zeros to meet the size required. I resized all of the images to `(600, 600)` square. This was done to each of the images and labels in turn. Source code is [TODO]

#### Images before resizing

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/resize_1.jpeg" | relative_url }}" alt="resize-1-1" /></span>

#### Images after resizing (black bars indicate zeros)

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/resize_2.jpeg" | relative_url }}" alt="resize_2" /></span>

### Label cleaning

Cleaning the labels proved to be one of the most intricate part of the projects - the problem with the labelled images was that while the colours of the labels represent the classes, i.e. nose, mouth etc... the colours are represented by r-g-b numbers and there are more unique colours than there are classes:

```python
print('Number of unique colors:', len(np.unique(label_sample[0])))
#--> Number of unique colors: 256
```

where `label_sample[0]` represents the array of pixels for the first labelled image.

In order to use the labelled image as a target class it was necessary to map the r-g-b pixels in the labels to integers ensuring that I ended up with only 7 classes. I achieved this using a K-means clustering algorithm with `K` being equal to the number of distinct classes in the original image. As I was just trying to fix colours that had slightly deviated from their intended value (i.e. a red part of the image that had distorted from `(255, 0, 0)` to `(249, 0, 0)`) I converted the images to grayscale and clustered based on the grayscale pixel value - I found this to work adequately for this situation.

The function below illustrates how the algorithm was implemented on the images, it utilised scikit-learns [K-means clustering class](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html).

```python
def run_kmeans(img, n_clusters):
    """Cluster pixels in an image to n distinct classes

    Args:
        img (np.array): Grayscale Image to convert
        n_clusters (int): Number of classes / clusters

    Returns:
        np.array of ints: with classes in range (1, n_clusters)
    """

    # Create features
    make_flat = MakeFlat(img.shape)
    flat_image = make_flat.transform(img)

    # kmeans
    kmeans = KMeans(n_clusters=n_clusters)
    kmeans.fit(flat_image)
    labels = kmeans.labels_ + 1

    img_labels = make_flat.inverse_transform(labels)

    return img_labels
```

this function takes a grayscale image of the labels and outputs an array of the same size with integer classes for each pixel. The class `MakeFlat` is simply a convenient class that flattens and array and then restores it back to its original shape.

The images below were input to the K-means algorithm and have **256 unique classes**

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/seg-1.jpeg" | relative_url }}" alt="seg-1" /></span>

The output of the k-means algorithm below has **7 unique classes** and are integer arrays as opposed to r-g-b arrays. (Although I present them here as colours for visualisation purposes.)

```python
print('Number of unique colors:', len(np.unique(processed_label_sample[0])))
#--> Number of unique colors: 7
```

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/seg-2.jpeg" | relative_url }}" alt="seg-2" /></span>

Whilst the K-means algorithm works to reduce the number of classes to 7 as desired, the order of the classes is arbitrary and so for each image the classes are different (note how the face is green on the left picture but red on the right). For this reason I wrote a function to map the outputs of the new images back to the original images so that the classes are consistent.

```python
def convert_labels(seg_img, labelled_img, label_dict, desired_labels):

    map_dict = {}
    for i in label_dict.keys():
        mask = mask_image(labelled_img,
                          i,
                          label_dict,
                          method='color_label',
                          return_type='bool')

        masked_seg = seg_img[mask[:, :, 0]]
        u = np.unique(masked_seg)
        try:
            max_ = u[0]
        except Exception:
            print('label error')

        if i in desired_labels:
            map_dict[max_] = [label_dict[i][1], i]
        else:
            # if not in desired label make 0
            map_dict[max_] = [0, i]

    seg_img = np.vectorize(map_label)(seg_img, map_dict)
    return seg_img
```

Here the input `seg_img` is the output of the K-means clustering algorithm above and `labelled_img` is the original r-g-b label. The dictionaries `label_dict` and `desired_labels` were given by the below and tell the algorithm above which r-g-b values correspond to which part of the face.

```python
# Map the classes first in the list indicates r-g-b value in original image
# second value indicates output for
raw_label_mapping = {
    'mouth': ['0-255-0', 1],
    'skin': ['255-255-0', 6],
    'hair': ['127-0-0', 5],
    'padding': ['0-0-0', 0],
    'nose': ['0-255-255', 2],
    'eyes': ['0-0-255', 3],
    'background': ['255-0-0', 7]
}

# if left_eye and right_eye specified split the eyes class into 2
desired_labels = [
    'mouth',
    'skin',
    'hair',
    'nose',
    'left_eye',
    'right_eye',
]
```

The function `convert_labels()` utilises another function `mask_image()` which takes the original labelled_image and masks it basked on the criteria in `label_dict`. By multiplying the result of this mask with the result of the K-means algorithm it is possible to infer which number corresponds to which class and then reassign the labels accordingly. I haven't included the full code here as it is quite verbose but the full source code is [here](https://github.com/erees1/faces-segmentation/blob/master/src/label_processing.py#L114). Below shows the `mask_image()` function in action.

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/mask-example.jpeg" | relative_url }}" alt="mask-example" /></span>

## Feature Creation

The model I build is done on a **per-pixel** basis. Each pixel is classified individually. This is unlike the more modern approaches using convolutional neural networks where features and strcutres are identified throughout the image. I took this approach as the dataset consists only of c. 80 images which is insufficient to train a neural network.

I experimented with two sets of features in this project, the first was to use solely the pixel r-g-b values and their location and the second was to use the pixel r-g-b values, location and Histogram of Orientated Gradient (HOG) features.

### Pixel location

In order to extract the pixel location for each image I wrote the following function

```python
def create_pixel_loc(shape):
    """Creates two vectors, encoding the x, y positions of pixels in an image
    of specified 'shape'

    Args:
        shape (tuple of length 2): Shape of image

    Returns:
        x (np.array): x coordinates (flattened)
        y (np.array): y coordinates (flattened)
    """
    row_ = np.array(range(0, shape[0] * shape[1]))
    y = row_.reshape(shape[0], shape[1]).T.flatten() % shape[1]
    x = row_ % shape[1]
    return x / shape[1], y / shape[1]
```

To illustrate what this piece of code does consider passing `shape=(2,2)` for a 2x2 image.

```python
x, y = create_pixel_loc((2,2))
x #--> array([0. , 0.5, 0. , 0.5])
y #--> array([0. , 0. , 0.5, 0.5])
```

This generalises to any nxn image. Appending the `x` and `y` values for each pixel to the r-g-b triplet therefore includes the pixel location as a feature for modelling.

### HOG Features

The limitation of this approach is that each data point considers each pixel totally in isolation with no account taken of the surrounding pixels or structure. In [1], Khan et al. utilise HOG (Histogram of Orientated Gradients) to encapsulate some information about the pixels surrounding region. This is actually quite a neat function which takes an image and calculates the predominant direction in the surrounding region. It is best demonstrated by the demonstration below I used scikit-images [HOG function](https://scikit-image.org/docs/dev/auto_examples/features_detection/plot_hog.html) to perform this calculation.

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/image-20200104170315064.png" | relative_url }}" alt="image-20200104170315064" /></span>

### Feature Creation Class

In order to streamline the use of these features I created an sklearn preprocessing class which can be used in an sklearn pipeline. Full source code is [here](https://github.com/erees1/faces-segmentation/blob/master/src/feature_processing.py). Here I use the class to specify grayscale images and include location feature but not HOG features.

```python
feature_params = {'color': 'gray',
                  'loc': True,
                  'hog': False}

# Create preditor features
feat = ftp.CreateFeatures(feature_params)

# Model
rfc1 = RandomForestClassifier(n_estimators=10, verbose=0, n_jobs=-1)

# Setup pipe
steps = [('features', feat), ('model', rfc1)]
pipe = Pipeline(steps)
```

## Modelling

As in [1] I utilised scikit-learns' random forest classifiers to predict the class of each pixel. In order to find the best hyper-parameters I performed a grid search. Unfortunately I wasn't able to use scikit-learns' inbuilt [GridSearchCV](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GridSearchCV.html) function as in each cross-validation fold I needed to split the images into train-test folds and then flatten the images and labels to feed through the random forest classifier. I thus created a custom grid search class to mimic the functionality of scikit-learns'.

### Grid search

```python
class CustomGridSearchCV():
    '''
    Grid search class to mimic scikit-learn, only fit method implemented
    '''

    def __init__(self,
                 estimator,
                 param_grid,
                 cv=3,
                 refit=True,
                 random_state=None):

        self.base_estimator = estimator
        self._estimator = copy.deepcopy(estimator)
        self.param_grid = param_grid
        self.pg = ParameterGrid(param_grid)
        self.refit = refit
        self.kf = kf = KFold(n_splits=cv, random_state=random_state)
        self.best_estimator_ = None
        self.scores_ = np.zeros((cv, 1))

    def fit(self, X, Y):
        best_score = 0
        for params in iter(tqdm(self.pg, desc='Grid search')):
            estimator = self._estimator
            estimator.set_params(**params)
            cv_scores = np.array(self._cross_val(estimator, X, Y))
            if cv_scores.mean() > self.scores_.mean():
                self.best_estimator_ = copy.deepcopy(estimator)
                self.scores_ = cv_scores

        if self.refit:
            self.best_estimator_.fit(X, Y.ravel())

    def _cross_val(self, estimator, X, Y):
        split_indices = self.kf.split(X_train, Y_train)

        cv_scores = []
        for ix in split_indices:
            train_ix = ix[0]
            test_ix = ix[1]
            estimator.fit(X_train[train_ix], Y_train[train_ix].ravel())
            score = estimator.score(X_train[test_ix], Y_train[test_ix].ravel())
            cv_scores.append(score)

        return cv_scores
```

I was able to use this class along with the feature creation class to search both the number of trees in my forest and the size of the HOG features cell.

```python
param_grid = {
    'model__n_estimators': range(40, 100, 10),
    'features__hog': [(5, 5), (10, 10), (15, 15), False]
}

gs = CustomGridSearchCV(pipe2, param_grid, cv=3, random_state=0)
gs.fit(X_train, Y_train)

# Save the best model
optimal_model = gs.best_estimator_
joblib.dump(optimal_model, save_path, compress=('zlib',7))
```

## Results

I ran two models as a comparison, the first which doesn't include HOG features and uses grayscale images and the second which uses colour images and HOG features, with the hyper-parameters selected using the grid search class created above.

### Model without HOG features

```
Accuracy Score 0.9345462962962963
              precision    recall  f1-score   support

       mouth       0.69      0.66      0.67      4709
        skin       0.94      0.92      0.93    194456
        hair       0.90      0.92      0.91    122930
        nose       0.74      0.70      0.72      8572
          nc       0.97      0.98      0.98    205415
    left_eye       0.55      0.61      0.58      1923
   right_eye       0.56      0.58      0.57      1995

    accuracy                           0.93    540000
   macro avg       0.76      0.77      0.76    540000
weighted avg       0.93      0.93      0.93    540000
```

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/model1.jpeg" | relative_url }}" alt="model1" /></span>

### Model with HOG features

```
Accuracy Score 0.9451351851851851
              precision    recall  f1-score   support

       mouth       0.80      0.56      0.66      4709
        skin       0.93      0.95      0.94    194456
        hair       0.93      0.93      0.93    122930
        nose       0.85      0.61      0.71      8572
          nc       0.98      0.98      0.98    205415
    left_eye       0.68      0.46      0.55      1923
   right_eye       0.76      0.47      0.58      1995

    accuracy                           0.95    540000
   macro avg       0.85      0.71      0.76    540000
weighted avg       0.94      0.95      0.94    540000
```

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/model2.jpeg" | relative_url }}" alt="model2" /></span>

Including the HOG features gave a slight bump of c.1% to the overall model accuracy.

### Feature Importance

The chart below shows the feature importance of the different elements in the model, pixel location turned out to be the strongest predictor of class which is unsurprising given the uniformity of the images. Thus their may be potential to use image augmentation to improve the robustness of the classifier.

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/feature-importance.jpeg" | relative_url }}" alt="feature-importance" /></span>

This shows that the location of the pixel is by far the biggest indicator of class. This highlights perhaps the limitation of the dataset in that the images are very consistent and well centred. Interestingly the pixel value for red is stronger than the other colours. This is potentially due to the red colour found in the skin tone of most of the images.

### Precision recall curve

The precision recall curve is a good way to investigate the quality of the classifier. For an explanation of what they are check out the good explanation [here](https://machinelearningmastery.com/roc-curves-and-precision-recall-curves-for-classification-in-python/).

<span class="image blog"><img src="{{ "./assets/images/segmentation_post/precision-recall-curve.jpeg" | relative_url }}" alt="precision-recall-curve" /></span>

This shows that the classifier is weakest at classifying class 3 and 4 which are the left and right eyes respectively. These correspond to the classes with the fewest number of observations (pixels). This contrasts with class 1 and 0, the padding and background respectively which are the most common classes.

## Conclusion

I found that it's possible to develop a fairly strong segmentation classifier of faces using only pixel value, pixel location and HOG features. Whilst the model performs fairly strongly on this dataset,the images in this dataset are very uniform being both well centred, well cropped and with similar backgrounds. The model therefore does lack generalisability to images outside this dataset. There are a couple of potential measures that could be taken to improve model performance and generalisability which I may come back and revisit in the future.

### Model Improvements

- Image augmentation to reduce the reliance on location feature
- Inclusion of more than one size of HOG feature to encapsulate information from both the immediate vicinity and other features further away from the pixel being classified
- Encode location information as relative rather than as absolute, for instance predict the location of the nose then base other measurements from this (I would have to think more deeply about how to implement this in practice)
- Create a histogram of colours from the pixels around the pixel being classified to encapsulate more information from the surrounding region, this is implemented in [1]

## References

[1] _Khalil Khan_, _Massimo Mauro_, _Riccardo Leonardi_,
**"Multi-class semantic segmentation of faces"**,
IEEE International Conference on Image Processing (ICIP), 2015
-- [**PDF**](https://github.com/massimomauro/FASSEG-repository/blob/master/papers/multiclass_face_segmentation_ICIP2015.pdf)

[2] _Khalil Khan_, _Massimo Mauro_, _Pierangelo Migliorati_, _Riccardo Leonardi_,
**"Head pose estimation through multiclass face segmentation"**,
IEEE International Conference on Multimedia and Expo (ICME), 2017
_In collaboration with [YonderLabs](http://www.yonderlabs.com)_
-- [**PDF**](https://github.com/massimomauro/FASSEG-repository/blob/master/papers/pose_estimation_by_segmentation_ICME2017.pdf)
