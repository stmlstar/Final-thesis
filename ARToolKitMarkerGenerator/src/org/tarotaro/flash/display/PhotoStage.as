package org.tarotaro.flash.display {
	import flash.display.Bitmap;
	import flash.display.DisplayObject;
	import flash.display.Shape;
	import flash.display.Sprite;
	import flash.geom.Matrix;
	
	/**
	* 画像を自動的にセンタリングするSpriteの子クラス
	* @author 太郎
	*/
	public class PhotoStage extends Sprite
	{
		
		private var _photoStageWidth:Number;
		private var _photoStageHeight:Number;
		private var _children:Array;

		public function PhotoStage(width:Number = 0, height:Number = 0) {
			this.photoStageWidth = width;
			this.photoStageHeight = height;
			this._children = new Array();
		}
		
		/**
		 * 全ての子要素を再度センタリングします。
		 */
		public function reflesh():void {
			this._children.forEach(resizeAndCenteringChild, null);
		}
		public override function addChild(child:DisplayObject):DisplayObject {
			this.resizeAndCenteringChild(child);
			this._children.push(child);
			return super.addChild(child);
		}
		
		public override function addChildAt(child:DisplayObject,index:int):DisplayObject {
			this.resizeAndCenteringChild(child);
			this._children.push(child);
			return super.addChildAt(child, index);
		}
		
		private function resizeAndCenteringChild(child:DisplayObject, index:int = 0, arr:Array = null):void {
			child.x = child.y = 0;
			this.resizeChild(child);
			this.centeringChild(child);
		}
		private function resizeChild(child:DisplayObject):void {
			var matrix:Matrix = child.transform.matrix.clone();
			var scale:Number = Math.min(1, Math.min(this.photoStageWidth/child.width,this.photoStageHeight/child.height));
			matrix.scale(scale, scale);
			child.transform.matrix = matrix;
		}

		private function centeringChild(child:DisplayObject):void {
			var matrix:Matrix = child.transform.matrix.clone();
			matrix.translate((this.photoStageWidth - child.width) / 2,(this.photoStageHeight - child.height)/2);
			child.transform.matrix = matrix;
		}

		public function get photoStageWidth():Number { return _photoStageWidth; }
		
		public function set photoStageWidth(value:Number):void {
			_photoStageWidth = value;
		}
		
		public function get photoStageHeight():Number { return _photoStageHeight; }
		
		public function set photoStageHeight(value:Number):void {
			_photoStageHeight = value;
		}
	}
	
}