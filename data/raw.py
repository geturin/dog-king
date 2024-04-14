import requests
from bs4 import BeautifulSoup
import json
import re


# get data from gamewith


def get_data(url, dtype=0):
    response = requests.get(url)
    # 检查请求是否成功
    if response.status_code == 200:
        # 使用BeautifulSoup解析HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # 找到指定的<div>元素
        if dtype == 0:
            target_div = soup.find("div", class_="grablu-table-db")
        elif dtype == 1:
            target_div = soup.find("div", class_="gbf-table_center gbf-hyouka_table")

        # 在这个<div>中找到所有的<tr>元素
        rows = target_div.find_all("tr", class_=["ca1", "get1", "get2"])

        # 准备将结果转化为JSON
        results = []
        for row in rows:

            classes = row.get("class", [])
            # 处理类名，提取特定的分类信息
            class_details = {}
            for cls in classes:
                match = re.match(r"(zo|bu|ca|sk|sw|get)(\d+)", cls)
                if match:
                    key, value = match.groups()
                    class_details[key] = int(value)

            img = row.find("img")
            img = img.get("data-original")
            match = re.search(r"/([^/]+)\.jpg$", img)
            if match:
                img_id = match.group(1)

            result = {
                "id": img_id,
                "img": img,
                "name": row.get("data-col1"),
                "details": class_details,
                "dtype": dtype,
                # 可以继续添加其他需要的数据字段
            }
            results.append(result)

        return results


# 载入指定的URL
url = "https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show/74390"
results = get_data(url, 0)

url2 = "https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show/21495"
results += get_data(url2, 1)

# 将结果保存到本地文件
with open("../public/output.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=4)
