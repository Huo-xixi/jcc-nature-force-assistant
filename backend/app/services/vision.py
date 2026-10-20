import base64
import binascii
from io import BytesIO

from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

from vision.recognize_one_cost import recognize_image


MAX_IMAGE_BYTES = 10 * 1024 * 1024


def recognize_one_cost_base64(image_base64: str, filename: str = "uploaded-image") -> dict:
    payload = image_base64.split(",", 1)[-1]
    try:
        raw = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as error:
        raise HTTPException(status_code=422, detail="图片不是有效的 Base64 数据") from error
    if not raw:
        raise HTTPException(status_code=422, detail="图片内容为空")
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="图片不能超过 10 MB")
    try:
        with Image.open(BytesIO(raw)) as image:
            return recognize_image(image, screenshot_label=filename)
    except UnidentifiedImageError as error:
        raise HTTPException(status_code=422, detail="无法读取图片，请上传 PNG 或 JPG") from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
