import sqlite3
import requests
from bs4 import BeautifulSoup
import re
from collections import defaultdict


class DBManager:
    def __init__(self, db_path):
        self.db_path = db_path
        self._initialize_db()

    def _initialize_db(self):
        """初始化数据库并创建表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 创建items表
        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            img TEXT,
            name TEXT,
            dtype INTEGER
        )
        """
        )

        # 创建details表
        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS details (
            id TEXT,
            key TEXT,
            value INTEGER,
            FOREIGN KEY (id) REFERENCES items (id)
        )
        """
        )

        # 创建scores表
        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS scores (
            item_id TEXT PRIMARY KEY,
            item_score INTEGER,
            FOREIGN KEY (item_id) REFERENCES items (id)
        )
        """
        )

        # 创建users表
        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS users (
            uid TEXT PRIMARY KEY,
            name TEXT,
            psw TEXT,
            icon TEXT
        )
        """
        )

        # 创建user_gacha表
        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS user_gacha (
            uid TEXT,
            item_id TEXT,
            date TEXT
        )
        """
        )

        conn.commit()
        conn.close()

    def _fetch_data_from_url(self, url, dtype=0):
        """爬取指定URL的数据"""
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            target_div = soup.find(
                "div",
                class_=(
                    "grablu-table-db"
                    if dtype == 0
                    else "gbf-table_center gbf-hyouka_table"
                ),
            )
            rows = target_div.find_all("tr", class_=["ca1", "get1", "get2"])

            results = []
            for row in rows:
                classes = row.get("class", [])
                class_details = {}
                for cls in classes:
                    match = re.match(r"(zo|bu|ca|sk|sw|get)(\d+)", cls)
                    if match:
                        key, value = match.groups()
                        class_details[key] = int(value)

                img = row.find("img").get("data-original")
                match = re.search(r"/([^/]+)\.jpg$", img)
                if match:
                    img_id = match.group(1)

                result = {
                    "id": img_id,
                    "img": img,
                    "name": row.get("data-col1"),
                    "details": class_details,
                    "dtype": dtype,
                }
                results.append(result)
            return results
        else:
            raise Exception(f"Failed to fetch data from {url}")

    def update_data(self):
        """爬取新数据并更新数据库"""
        # 数据来源URL
        url1 = "https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show/74390"
        url2 = "https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show/21495"

        # 爬取数据
        data1 = self._fetch_data_from_url(url1, dtype=0)
        data2 = self._fetch_data_from_url(url2, dtype=1)

        # 更新数据库
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 清空表
        cursor.execute("DELETE FROM items")
        cursor.execute("DELETE FROM details")

        # 插入新数据
        for item in data1 + data2:
            cursor.execute(
                """
            INSERT INTO items (id, img, name, dtype) VALUES (?, ?, ?, ?)
            """,
                (item["id"], item["img"], item["name"], item["dtype"]),
            )

            for key, value in item["details"].items():
                cursor.execute(
                    """
                INSERT INTO details (id, key, value) VALUES (?, ?, ?)
                """,
                    (item["id"], key, value),
                )

            # 如果scores表中不存在该item_id，则插入
            cursor.execute(
                """
            INSERT OR IGNORE INTO scores (item_id, item_score) VALUES (?, ?)
            """,
                (item["id"], 0),  # 默认分数为0
            )

        conn.commit()
        conn.close()

    def fetch_items(self):
        """查询所有items及其details，并返回JSON格式"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 查询items表数据
        cursor.execute("SELECT id, img, name, dtype FROM items")
        items = cursor.fetchall()

        # 查询details表数据
        cursor.execute("SELECT id, key, value FROM details")
        details = cursor.fetchall()

        conn.close()

        # 将details数据转换为 {id: {key: value, ...}} 的格式
        details_dict = defaultdict(dict)
        for item_id, key, value in details:
            details_dict[item_id][key] = value

        # 将items和details组合成JSON格式
        result = []
        for item_id, img, name, dtype in items:
            result.append(
                {
                    "id": item_id,
                    "img": img,
                    "name": name,
                    "details": details_dict.get(item_id, {}),
                    "dtype": dtype,
                }
            )

        return result

    def update_scores(self, item_ids, new_score):
        """更新scores表中指定item_ids的分数，并清除已有相同分数的记录"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 将之前所有item_score等于new_score的记录的分数设为NULL
        cursor.execute(
            """
        UPDATE scores SET item_score = NULL WHERE item_score = ?
        """,
            (new_score,),
        )

        # 更新指定item_ids的分数
        cursor.executemany(
            """
        UPDATE scores SET item_score = ? WHERE item_id = ?
        """,
            [(new_score, item_id) for item_id in item_ids],
        )

        conn.commit()
        conn.close()

    def update_user_gacha(self, uid, new_item_ids, date):
        """更新user_gacha表中指定用户的数据"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 删除已有的相同uid和date的记录
        cursor.execute(
            """
        DELETE FROM user_gacha WHERE uid = ? AND date = date(?)
        """,
            (uid, date),
        )

        # 插入新数据
        cursor.executemany(
            """
        INSERT INTO user_gacha (uid, item_id, date) VALUES (?, ?, date(?))
        """,
            [(uid, item_id, date) for item_id in new_item_ids],
        )

        conn.commit()
        conn.close()

    def clear_data(self):
        """清空数据库中的数据（开发测试用）"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM items")
        cursor.execute("DELETE FROM details")
        cursor.execute("DELETE FROM scores")
        cursor.execute("DELETE FROM users")
        cursor.execute("DELETE FROM user_gacha")

        conn.commit()
        conn.close()


if __name__ == "__main__":
    db_manager = DBManager(".data.db")
    print(db_manager.fetch_items())
