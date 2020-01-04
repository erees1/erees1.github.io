import os
import re
import shutil
import sys

arg_1 = sys.argv[1]

if arg_1 == 'True' or arg_1 == 'true':
    reverse = True
else:
    reverse = False


posts_dir = './_posts'
asset_dir = './assets/images/segmentation_post'


def move_image(source_dir, dest_dir, img_name):
    if os.path.exists(dest_dir):
        shutil.move(source_dir+'/'+img_name, dest_dir+'/'+img_name)


def convert_markdown_to_html(line):
    src = re.findall('\((.*?)\)', line)[0] # NOQA
    alt = re.findall('\[(.*?)\]', line)[0] # NOQA
    img_name = src.split('/')[-1]
    src = asset_dir+'/'+img_name
    new_line = '<span class="image blog">'\
        '<img src="{{ "%s" | relative_url }}" alt="%s" /></span>' % (src, alt)

    img_name = src.split('/')[-1] # NOQA
    move_image(posts_dir+'/assets', asset_dir, img_name)
    return new_line
1

def convert_html_to_markdown(line):
    src = re.findall('''src=["'].*?["'](.*?)["'].*?["']''', line)[0]
    alt = re.findall('alt="(.*?)"', line)[0]
    img_name = src.split('/')[-1] # NOQA
    new_line = '![%s](%s)' % (alt, './assets/'+img_name)
    move_image(asset_dir, posts_dir+'/assets', img_name)
    return new_line


files = os.listdir(posts_dir)
files = [file for file in files if '.md' in file]

for file in files:
    with open(posts_dir+'/'+file, 'r') as f:
        data = f.readlines()

    # If there is a picture on that line
    new_data = data
    for i, line in enumerate(data):
        if reverse is False and '![' in line:
            # get the new line and move image
            new_data[i] = convert_markdown_to_html(line)+'\n'

        if reverse is True and '<img src=' in line and 'assets/images' in line:
            # get the new line and move image
            new_data[i] = convert_html_to_markdown(line)+'\n'

    with open(posts_dir+'/'+file, 'w') as file:
        file.writelines(new_data)
