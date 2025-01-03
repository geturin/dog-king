import sqlite3
import requests
from bs4 import BeautifulSoup
import re
from collections import defaultdict
from datetime import datetime, timedelta


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
                uid INTEGER PRIMARY KEY AUTOINCREMENT,
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
        UPDATE scores SET item_score = 0 WHERE item_score = ?
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

    def fetch_all_scores(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT item_score, GROUP_CONCAT(item_id) as item_ids
            FROM scores
            WHERE item_score NOT IN (0,1,3)
            GROUP BY item_score
        """
        )
        records = cursor.fetchall()
        conn.close()

        return {str(score): ids if ids else "" for score, ids in records}

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

    def fetch_user_scores_group_by_date(self, uid):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT date, GROUP_CONCAT(item_id) as item_ids
            FROM user_gacha
            WHERE uid = ?
            GROUP BY date
            """,
            (uid,),
        )
        records = cursor.fetchall()
        conn.close()

        return {str(date): ids if ids else "" for date, ids in records}

    def fetch_all_user_name(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT name
            FROM users            
            """,
        )
        records = cursor.fetchall()
        conn.close()

        return records

    def user_login(self, name, psw):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT uid
            FROM users
            WHERE name = ? AND psw = ?
            """,
            (name, psw),
        )
        user = cursor.fetchone()
        conn.close()

        return {"uid": user[0]} if user else {"uid": "0"}

    def create_user(self, name, psw):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.executemany(
            """
        INSERT INTO users (name , psw) VALUES (?, ?)
        """,
            [(name, psw)],
        )

        conn.commit()
        conn.close()

        return self.user_login(name, psw)

    def fetch_all_user_scores(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT u.name, ug.uid, SUM(
                CASE
                    WHEN s.item_score > 0 THEN s.item_score
                    ELSE
                        CASE
                            WHEN i.dtype = 1 THEN 1
                            WHEN i.dtype = 0 THEN 3
                            ELSE 0
                        END
                END
            ) as total_score
            FROM user_gacha ug
            LEFT JOIN scores s ON ug.item_id = s.item_id
            LEFT JOIN items i ON ug.item_id = i.id
            LEFT JOIN users u ON ug.uid = u.uid
            GROUP BY ug.uid, u.name
            """
        )
        records = cursor.fetchall()
        conn.close()

        return [
            {"name": record[0], "uid": record[1], "total_score": record[2]}
            for record in records
        ]

    def fetch_user_daily_scores(self):
        """查询所有用户的每日得分情况，包括缺失日期得分设为0"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 获取所有用户
        cursor.execute("SELECT uid, name FROM users")
        users = cursor.fetchall()

        # 获取日期范围
        cursor.execute("SELECT MIN(date) FROM user_gacha")
        start_date = cursor.fetchone()[0]
        start_date = (
            datetime.strptime(start_date, "%Y-%m-%d")
            if start_date
            else datetime.today()
        )
        end_date = datetime.today()

        # 初始化结果
        result = []

        # 遍历每一天
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")

            for uid, name in users:
                cursor.execute(
                    """
                    SELECT SUM(
                        CASE
                            WHEN s.item_score > 0 THEN s.item_score
                            ELSE
                                CASE
                                    WHEN i.dtype = 1 THEN 1
                                    WHEN i.dtype = 0 THEN 3
                                    ELSE 0
                                END
                        END
                    ) as daily_score
                    FROM user_gacha ug
                    LEFT JOIN scores s ON ug.item_id = s.item_id
                    LEFT JOIN items i ON ug.item_id = i.id
                    WHERE ug.uid = ? AND ug.date = ?
                    """,
                    (uid, date_str),
                )
                score = cursor.fetchone()[0] or 0
                result.append(
                    {"name": name, "uid": uid, "date": date_str, "daily_score": score}
                )

            current_date += timedelta(days=1)

        conn.close()
        return result

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
    db_manager.update_scores("ls101472", "1")
