<?php

namespace HikeflowUi\Includes;

use SirveliaLabs\Blade\Blade;

class HikeFlowLoader
{
	private static $instance = NULL;
	private $blade;

	private function __construct()
	{
		$this->blade = new Blade(HIKEFLOWUI_PATH . 'resources/views', HIKEFLOWUI_PATH . 'resources/cache');


	}

	// Clone not allowed
	private function __clone()
	{
	}

	public static function getInstance()
	{
		if (is_null(self::$instance)) {
			self::$instance = new HikeFlowLoader();
		}
		return self::$instance;
	}

	private function loadComponents()
	{
		$this->blade->compiler()->components([
			'alert'                     => 'test-alert',
		]);
	}
}
