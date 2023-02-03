<?php
namespace HikeflowUi\Includes;

class Loader
{
	protected $plugin_name;
	protected $plugin_version;

	public function __construct()
	{
		$this->plugin_version = defined('HIKEFLOWUI_VERSION') ? HIKEFLOWUI_VERSION : '1.0.0';
		$this->plugin_name = 'hikeflow-ui';
		$this->load_dependencies();

		add_action('plugins_loaded', [$this, 'load_plugin_textdomain']);
		add_action('wp_enqueue_scripts', [$this, 'load_assets'], 100);
	}

	private function load_dependencies()
	{
		foreach (glob(HIKEFLOWUI_PATH . 'Functionality/*.php') as $filename) {
			$class_name = '\\HikeflowUi\Functionality\\'. basename($filename, '.php');
			if (class_exists($class_name)) {
				try {
					new $class_name($this->plugin_name, $this->plugin_version);
				}
				catch (\Throwable $e) {
					pb_log($e);
					continue;
				}
			}
		}
	}

	public function load_plugin_textdomain()
	{
		load_plugin_textdomain('hikeflow-ui', false, HIKEFLOWUI_BASENAME . '/languages/');
	}

	public function load_assets()
	{
		wp_enqueue_style('hikeflow-ui/app.css', HIKEFLOWUI_URL . 'dist/app.css', false, null);
		wp_enqueue_script('hikeflow-ui/app.js', HIKEFLOWUI_URL . 'dist/app.js', [], null, true);

		wp_localize_script('hikeflow-ui/app.js', 'plugin_placeholder_ajax', [
			'ajaxurl'   => admin_url('admin-ajax.php'),
			'nonce'     => wp_create_nonce('ajax-nonce'),
		]);
	}
}
