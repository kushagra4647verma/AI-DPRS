"""Run inference with a YOLO11 model on images, videos, directories, streams

Usage:
    $ python path/to/detect.py --source path/to/video.mp4 --weights yolo11s.pt
"""

import argparse
from pathlib import Path
from ultralytics import YOLO


def run(weights='yolo11s.pt',
        source='data/images',
        project='static',
        name='',
        conf_thres=0.25,
        iou_thres=0.45,
        max_det=1000,
        device='',
        save_txt=False,
        save_conf=False,
        save_crop=False,
        classes=None,
        line_thickness=3,
        hide_labels=False,
        hide_conf=False,
        exist_ok=True,
        ):
    """Run YOLO11 inference on the given source."""

    # Load model
    model = YOLO(weights)

    # Run inference
    results = model.predict(
        source=source,
        conf=conf_thres,
        iou=iou_thres,
        max_det=max_det,
        device=device if device else None,
        save_txt=save_txt,
        save_conf=save_conf,
        save_crop=save_crop,
        classes=classes,
        line_width=line_thickness,
        show_labels=not hide_labels,
        show_conf=not hide_conf,
        project=project,
        name=name,
        exist_ok=exist_ok,
        save=True,
    )

    # Print summary
    for r in results:
        print(f"Detected {len(r.boxes)} objects in {r.path}")

    print("Done.")


def parse_opt():
    parser = argparse.ArgumentParser()
    parser.add_argument('--weights', type=str, default='yolo11s.pt', help='model.pt path')
    parser.add_argument('--source', type=str, default='data/images', help='file/dir/URL/glob, 0 for webcam')
    parser.add_argument('--conf-thres', type=float, default=0.25, help='confidence threshold')
    parser.add_argument('--iou-thres', type=float, default=0.45, help='NMS IoU threshold')
    parser.add_argument('--max-det', type=int, default=1000, help='maximum detections per image')
    parser.add_argument('--device', default='', help='cuda device, i.e. 0 or 0,1,2,3 or cpu')
    parser.add_argument('--save-txt', action='store_true', help='save results to *.txt')
    parser.add_argument('--save-conf', action='store_true', help='save confidences in --save-txt labels')
    parser.add_argument('--save-crop', action='store_true', help='save cropped prediction boxes')
    parser.add_argument('--classes', nargs='+', type=int, help='filter by class: --class 0, or --class 0 2 3')
    parser.add_argument('--project', default='static', help='save results to project/name')
    parser.add_argument('--name', default='', help='save results to project/name')
    parser.add_argument('--exist-ok', default=True, action='store_true', help='existing project/name ok, do not increment')
    parser.add_argument('--line-thickness', default=3, type=int, help='bounding box thickness (pixels)')
    parser.add_argument('--hide-labels', default=False, action='store_true', help='hide labels')
    parser.add_argument('--hide-conf', default=False, action='store_true', help='hide confidences')
    opt = parser.parse_args()
    return opt


def main(opt):
    run(**vars(opt))


if __name__ == "__main__":
    opt = parse_opt()
    main(opt)
