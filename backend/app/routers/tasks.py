from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[schemas.TaskResponse])
def get_tasks(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tasks for the current user"""
    tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.id
    ).order_by(models.Task.order_index, models.Task.created_at).offset(skip).limit(limit).all()
    return tasks


@router.post("/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: schemas.TaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task"""
    # Get max order_index to append at end
    max_order = db.query(models.Task).filter(
        models.Task.user_id == current_user.id
    ).order_by(models.Task.order_index.desc()).first()
    
    order_index = (max_order.order_index + 1) if max_order else 0
    
    # Exclude order_index from task dict since we calculate it ourselves
    task_data = task.model_dump(exclude={'order_index'})
    db_task = models.Task(**task_data, user_id=current_user.id, order_index=order_index)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific task"""
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a task"""
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a task"""
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(task)
    db.commit()
    return None


@router.post("/reorder", status_code=status.HTTP_200_OK)
def reorder_tasks(
    task_ids: List[int],
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder tasks by providing a list of task IDs in the desired order"""
    tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.id.in_(task_ids)
    ).all()
    
    if len(tasks) != len(task_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some tasks not found"
        )
    
    # Create a mapping of task_id to order_index
    task_map = {task.id: task for task in tasks}
    
    # Update order_index based on the provided order
    for index, task_id in enumerate(task_ids):
        task_map[task_id].order_index = index
    
    db.commit()
    return {"message": "Tasks reordered successfully"}

