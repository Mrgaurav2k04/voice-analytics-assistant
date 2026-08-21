from typing import Any


dataset_store: dict[str, dict[str, Any]] = {}


def save_dataset(
    file_id: str,
    raw_df,
    processed_df,
    metadata: dict
) -> None:
    dataset_store[file_id] = {
        "raw_df": raw_df,
        "processed_df": processed_df,
        "metadata": metadata
    }


def get_dataset(file_id: str):
    return dataset_store.get(file_id)


def delete_dataset(file_id: str) -> bool:
    if file_id not in dataset_store:
        return False

    del dataset_store[file_id]
    return True